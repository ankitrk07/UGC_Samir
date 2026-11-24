import Stripe from 'stripe';
import { Prisma, type User, type Subscription, type SubscriptionStatus } from '@prisma/client';
import { db, transaction, outbox } from '../../core/db';
import { assert, AppError } from '../../core/http';
import { env } from '../../config';
import { hash, hmacValid } from '../../core/security';
import { reconcileRefund } from './refunds';
import { creatorFor } from '../campaigns/service';
export function stripe() { assert(env.STRIPE_SECRET_KEY, 503, 'BILLING_UNAVAILABLE', 'Stripe is not configured.'); return new Stripe(env.STRIPE_SECRET_KEY, { timeout: 15000, maxNetworkRetries: 0 }); }
export async function razorpay(path: string, method = 'POST', body?: unknown, key?: string, timeoutMs = 15000): Promise<Record<string, unknown>> {
    assert(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET, 503, 'BILLING_UNAVAILABLE', 'Razorpay is not configured.');
    const res = await fetch(`https://api.razorpay.com/v1/${path}`, { method, headers: { Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'Content-Type': 'application/json', ...(key ? { 'X-Payout-Idempotency': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeoutMs) });
    assert(res.ok, 502, 'BILLING_PROVIDER_ERROR', 'The billing provider could not complete this request.');
    return await res.json() as Record<string, unknown>;
}
export async function createProviderCheckout(user: User, input: {
    provider: 'stripe' | 'razorpay';
    billing: 'monthly' | 'annual';
    plan: 'SELF_SERVICE' | 'FULL_SERVICE';
}, idempotencyKey: string) {
    const plan = await db.pricingPlan.findUnique({ where: { plan: input.plan } });
    assert(plan && !plan.deletedAt, 404, 'PLAN_NOT_FOUND', 'Plan unavailable.');
    assert(input.plan === 'SELF_SERVICE', 400, 'CUSTOM_PLAN', 'Book a call for a Full Service scope.');
    const subscription = await db.subscription.findFirst({ where: { userId: user.id, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    const endedCancellation = subscription?.status === 'CANCELLED' && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= new Date();
    assert(subscription?.status !== 'ACTIVE' && (!subscription?.providerSubId || endedCancellation), 409, 'ALREADY_SUBSCRIBED', 'Change or reconcile your current subscription instead.');
    const trialEnd = !subscription?.providerSubId && subscription?.trialEndsAt && subscription.trialEndsAt.getTime() > Date.now() ? Math.max(Math.floor(subscription.trialEndsAt.getTime() / 1000), Math.floor(Date.now() / 1000) + 172800) : undefined;
    // Preserve old provider bindings so delayed invoices remain attributable.
    const local = subscription && !subscription.providerSubId ? subscription : await db.subscription.create({ data: { userId: user.id, status: 'EXPIRED', plan: input.plan, billing: input.billing } });
    if (input.provider === 'stripe') {
        const price = input.billing === 'annual' ? plan.stripeAnnualPriceId : plan.stripeMonthlyPriceId;
        assert(price, 503, 'PRICE_UNAVAILABLE', 'Configure the Stripe price for this plan.');
        const session = await stripe().checkout.sessions.create({ mode: 'subscription', billing_address_collection:'required',tax_id_collection:{enabled:true},customer_email: user.email, line_items: [{ price, quantity: 1 }], client_reference_id: local.id, metadata: { subscriptionId: local.id, userId: user.id, checkoutAttemptId: idempotencyKey }, subscription_data: { metadata: { subscriptionId: local.id, userId: user.id, billing: input.billing }, ...(trialEnd ? { trial_end: trialEnd } : {}) }, success_url: `${env.SITE_URL}/dashboard?checkout=success`, cancel_url: `${env.SITE_URL}/pricing` }, { idempotencyKey: `checkout:${user.id}:${idempotencyKey}` });
        return { provider: 'stripe', url: session.url, sessionId: session.id };
    }
    const providerPlan = input.billing === 'annual' ? plan.razorpayAnnualPlanId : plan.razorpayMonthlyPlanId;
    assert(providerPlan, 503, 'PRICE_UNAVAILABLE', 'Configure the Razorpay plan.');
    const sub = await razorpay('subscriptions', 'POST', { plan_id: providerPlan, total_count: input.billing === 'annual' ? 10 : 120, customer_notify: 1, ...(trialEnd ? { start_at: trialEnd } : {}), notes: { subscriptionId: local.id, userId: user.id, billing: input.billing, checkoutAttemptId: idempotencyKey } });
    await db.subscription.update({ where: { id: local.id }, data: { provider: 'razorpay', providerSubId: String(sub.id), billing: input.billing } });
    return { provider: 'razorpay', subscriptionId: sub.id, url: sub.short_url, keyId: env.RAZORPAY_KEY_ID };
}
export function verifyWebhook(provider: 'stripe' | 'razorpay', body: Buffer, signature: string, eventHeader?: string): {
    id: string;
    type: string;
    object: Record<string, unknown>;
} {
    if (provider === 'stripe') {
        assert(env.STRIPE_WEBHOOK_SECRET, 503, 'WEBHOOK_UNAVAILABLE', 'Stripe webhook is not configured.');
        let event: Stripe.Event;
        try {
            event = stripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
        }
        catch {
            throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature.');
        }
        return { id: event.id, type: event.type, object: event.data.object as unknown as Record<string, unknown> };
    }
    assert(env.RAZORPAY_WEBHOOK_SECRET, 503, 'WEBHOOK_UNAVAILABLE', 'Razorpay webhook is not configured.');
    assert(hmacValid(body, signature, env.RAZORPAY_WEBHOOK_SECRET), 400, 'INVALID_SIGNATURE', 'Invalid webhook signature.');
    let event: {
        event?: string;
        payload?: Record<string, {
            entity: Record<string, unknown>;
        }>;
    };
    try { event = JSON.parse(body.toString()) as typeof event; } catch { throw new AppError(400, 'INVALID_WEBHOOK', 'Invalid provider payload.'); }
    assert(event && typeof event === 'object' && typeof event.event === 'string' && event.event.length > 0 && event.payload && typeof event.payload === 'object', 400, 'INVALID_WEBHOOK', 'Invalid provider payload.');
    const object = { subscription: event.payload.subscription?.entity, payment: event.payload.payment?.entity, ...event.payload.refund?.entity };
    return { id: eventHeader ?? hash(body), type: event.event, object };
}
export type SubscriptionReader = (provider: 'stripe' | 'razorpay', id: string) => Promise<Record<string, unknown>>;
export const readProviderSubscription: SubscriptionReader = async (provider, id) => {
    try {
        if (provider === 'razorpay') return await razorpay('subscriptions/' + encodeURIComponent(id), 'GET', undefined, undefined, 5000);
        return await stripe().subscriptions.retrieve(id, {}, { timeout: 5000, maxNetworkRetries: 0 }) as unknown as Record<string, unknown>;
    } catch {
        throw new AppError(502, 'RECONCILIATION_UNAVAILABLE', 'Current provider subscription state could not be verified.');
    }
};
export const readProviderRefund: SubscriptionReader = async (provider, id) => {
    try {
        if (provider === 'razorpay') return await razorpay('refunds/' + encodeURIComponent(id), 'GET', undefined, undefined, 5000);
        return await stripe().refunds.retrieve(id, {}, { timeout: 5000, maxNetworkRetries: 0 }) as unknown as Record<string, unknown>;
    } catch {
        throw new AppError(502, 'RECONCILIATION_UNAVAILABLE', 'Current provider refund state could not be verified.');
    }
};

export async function reconcileRefundEvent(tx: Prisma.TransactionClient, provider: 'stripe' | 'razorpay', object: Record<string, unknown>, read: SubscriptionReader) {
    const eventMetadata = (provider === 'stripe' ? object.metadata : object.notes) as Record<string, string> | undefined;
    const id = eventMetadata?.trendhiveRefundId;
    if (!id) {
        await tx.auditLog.create({ data: { action: 'UNCORRELATED_PROVIDER_REFUND', resource: 'Refund', resourceId: typeof object.id === 'string' ? object.id.slice(0, 200) : undefined, details: { provider } } });
        return; // Finance must correlate external dashboard refunds explicitly.
    }
    const providerId = String(object.id);
    const current = await read(provider, providerId);
    const metadata = (provider === 'stripe' ? current.metadata : current.notes) as Record<string, string> | undefined;
    assert(current.id === providerId && metadata?.trendhiveRefundId === id, 409, 'REFUND_BINDING_MISMATCH', 'Current provider refund does not match this request.');
    const amount = Number(current.amount);
    assert(Number.isSafeInteger(amount) && amount > 0 && typeof current.currency === 'string', 502, 'INVALID_PROVIDER_STATE', 'Provider refund amount/currency is invalid.');
    const status = String(current.status);
    assert(['pending', 'requires_action', 'succeeded', 'processed', 'failed', 'canceled'].includes(status), 502, 'INVALID_PROVIDER_STATE', 'Provider refund status is unsupported.');
    await reconcileRefund(tx, id, status, providerId, amount, current.currency, provider);
}

export async function reconcileSubscription(tx: Prisma.TransactionClient, local: Subscription, provider: 'stripe' | 'razorpay', id: string, read: SubscriptionReader) {
    assert(!local.providerSubId || local.providerSubId === id, 409, 'SUBSCRIPTION_BINDING_MISMATCH', 'Provider subscription binding requires reconciliation.');
    assert(!local.provider || local.provider === provider, 409, 'SUBSCRIPTION_BINDING_MISMATCH', 'Subscription belongs to another provider.');
    // Read provider state after the local row inside the serializable transaction.
    // A concurrent subscription write forces a transaction retry and a fresh read.
    const current = await read(provider, id);
    assert(current.id === id, 502, 'INVALID_PROVIDER_STATE', 'Provider returned another subscription.');
    const metadata = (provider === 'stripe' ? current.metadata : current.notes) as Record<string, string> | undefined;
    assert(!metadata?.subscriptionId || metadata.subscriptionId === local.id, 409, 'SUBSCRIPTION_BINDING_MISMATCH', 'Provider subscription binding does not match.');
    assert(!metadata?.userId || metadata.userId === local.userId, 409, 'SUBSCRIPTION_BINDING_MISMATCH', 'Provider subscription owner does not match.');
    const states: Record<string, SubscriptionStatus> = provider === 'stripe'
        ? { active: 'ACTIVE', trialing: 'TRIALING', canceled: 'CANCELLED', past_due: 'PAST_DUE', unpaid: 'PAST_DUE', incomplete: 'EXPIRED', incomplete_expired: 'EXPIRED', paused: 'PAST_DUE' }
        : { active: 'ACTIVE', cancelled: 'CANCELLED', completed: 'EXPIRED', expired: 'EXPIRED', halted: 'PAST_DUE', pending: 'PAST_DUE', paused: 'PAST_DUE', created: local.trialEndsAt && local.trialEndsAt > new Date() ? 'TRIALING' : 'EXPIRED', authenticated: local.trialEndsAt && local.trialEndsAt > new Date() ? 'TRIALING' : 'EXPIRED' };
    let status = Object.hasOwn(states, String(current.status)) ? states[String(current.status)] : undefined;
    assert(status, 502, 'INVALID_PROVIDER_STATE', 'Provider subscription status is unsupported.');
    if (provider === 'stripe' && current.cancel_at_period_end === true && status === 'ACTIVE') status = 'CANCELLED';
    const items = current.items as { data?: { current_period_end?: number }[] } | undefined;
    const period = Number(provider === 'stripe' ? current.current_period_end ?? items?.data?.[0]?.current_period_end : current.current_end);
    const trial = Number(current.trial_end);
    const validEpoch = (value: number) => Number.isSafeInteger(value) && value > 0 && value <= 8640000000000;
    return tx.subscription.update({ where: { id: local.id }, data: { provider, providerSubId: id, status, ...(metadata?.billing === 'monthly' || metadata?.billing === 'annual' ? { billing: metadata.billing } : {}), ...(validEpoch(period) ? { currentPeriodEnd: new Date(period * 1000) } : {}), ...(provider === 'stripe' && status === 'TRIALING' && validEpoch(trial) ? { trialEndsAt: new Date(trial * 1000) } : {}) } });
}

export async function processWebhook(provider: 'stripe' | 'razorpay', body: Buffer, signature: string, eventHeader?: string, readSubscription: SubscriptionReader = readProviderSubscription, readRefund: SubscriptionReader = readProviderRefund) {
    const e = verifyWebhook(provider, body, signature, eventHeader);
    assert(e.id.length <= 200 && e.type.length <= 200, 400, 'INVALID_WEBHOOK', 'Invalid event identifier.');
    try {
        return await transaction(async (tx) => {
            const existing = await tx.webhookEvent.findUnique({ where: { provider_eventId: { provider, eventId: e.id } } });
            if (existing) {
                assert(existing.payloadHash === hash(body), 409, 'EVENT_MISMATCH', 'Event content does not match.');
                return { received: true, duplicate: true };
            }
            const record = await tx.webhookEvent.create({ data: { provider, eventId: e.id, type: e.type, payloadHash: hash(body) } });
            const object = e.object;
            if(provider==='stripe'&&e.type==='checkout.session.completed'){const attemptId=(object.metadata as Record<string,string>|undefined)?.checkoutAttemptId;if(attemptId)await tx.checkoutAttempt.updateMany({where:{id:attemptId},data:{status:'COMPLETED'}});}
            if(provider==='razorpay'&&['subscription.activated','subscription.charged'].includes(e.type)){const sub=object.subscription as {notes?:Record<string,string>}|undefined;const attemptId=sub?.notes?.checkoutAttemptId;if(attemptId)await tx.checkoutAttempt.updateMany({where:{id:attemptId},data:{status:'COMPLETED'}});}
            if (provider === 'stripe' && ['refund.created', 'refund.updated', 'refund.failed'].includes(e.type)) {
                await reconcileRefundEvent(tx, provider, object, readRefund);
            }
            if (provider === 'razorpay' && e.type.startsWith('refund.')) {
                await reconcileRefundEvent(tx, provider, object, readRefund);
            }
            if (provider === 'stripe') {
                if (e.type === 'checkout.session.completed') {
                    const localId = String((object.metadata as Record<string, string> | undefined)?.subscriptionId ?? '');
                    const providerSubId = typeof object.subscription === 'string' ? object.subscription : undefined;
                    const local = await tx.subscription.findUnique({ where: { id: localId } });
                    if (local && providerSubId)
                        await reconcileSubscription(tx, local, provider, providerSubId, readSubscription);
                }
                if (e.type.startsWith('customer.subscription.')) {
                    const metadata = object.metadata as Record<string, string> | undefined;
                    const local = await tx.subscription.findFirst({ where: { OR: [{ providerSubId: String(object.id) }, ...(metadata?.subscriptionId ? [{ id: metadata.subscriptionId }] : [])] } });
                    if (local) {
                        await reconcileSubscription(tx, local, provider, String(object.id), readSubscription);
                    }
                }
                if (e.type === 'invoice.paid' || e.type === 'invoice.payment_failed') {
                    const parent = object.parent as {
                        subscription_details?: {
                            subscription?: string;
                        };
                    } | undefined;
                    const providerSub = String(object.subscription ?? parent?.subscription_details?.subscription ?? '');
                    const local = await tx.subscription.findUnique({ where: { providerSubId: providerSub } });
                    if (local) {
                        const synced = await reconcileSubscription(tx, local, provider, providerSub, readSubscription);
                        if (e.type === 'invoice.payment_failed' && synced?.status === 'PAST_DUE' && local.status !== 'PAST_DUE') {
                            const u = await tx.user.findUniqueOrThrow({ where: { id: local.userId } });
                            await outbox(tx, 'email', { to: u.email, subject: 'TRENDHIVE payment failed', text: 'Update your payment method in your billing portal to keep your subscription active.' });
                            await outbox(tx, 'notification', { userId: u.id, type: 'payment.failed', title: 'Payment failed', body: 'Please update your payment method.' });
                        }
                        else if (e.type === 'invoice.paid') {
                            const amount = Number(object.amount_paid);
                            assert(Number.isSafeInteger(amount) && amount >= 0, 400, 'INVALID_AMOUNT', 'Invalid invoice amount.');
                            const taxes = (object.total_taxes??object.total_tax_amounts) as {
                                amount: number;
                            }[] | undefined;
                            const payment = await tx.payment.upsert({ where: { providerPaymentId: `stripe:${String(object.id)}` }, create: { userId: local.userId, subscriptionId: local.id, provider, providerPaymentId: `stripe:${String(object.id)}`, amountMinor: amount, currency: String(object.currency).toUpperCase(), status: 'PAID' }, update: {} });
                            await tx.invoice.upsert({ where: { paymentId: payment.id }, create: { paymentId: payment.id, number: `TH-${payment.id}`, gstin:(object.customer_tax_ids as {type:string;value:string}[]|undefined)?.find(t=>t.type==='in_gst')?.value,billingName: String(object.customer_name ?? ''), billingAddress: JSON.stringify(object.customer_address ?? {}), taxMinor: taxes?.reduce((n, t) => n + t.amount, 0) ?? 0, pdfUrl: typeof object.invoice_pdf === 'string' ? object.invoice_pdf : null }, update: {} });
                        }
                    }
                }
            }
            else {
                const sub = object.subscription as Record<string, unknown> | undefined;
                const paymentObject = object.payment as Record<string, unknown> | undefined;
                const notes = sub?.notes as Record<string, string> | undefined;
                const local = await tx.subscription.findFirst({ where: { OR: [...(sub?.id ? [{ providerSubId: String(sub.id) }] : []), ...(notes?.subscriptionId ? [{ id: notes.subscriptionId }] : [])] } });
                if (local && sub) {
                    const synced = await reconcileSubscription(tx, local, provider, String(sub.id), readSubscription);
                    if(synced?.status==='PAST_DUE' && local.status!=='PAST_DUE'){const u=await tx.user.findUniqueOrThrow({where:{id:local.userId}});await outbox(tx,'email',{to:u.email,subject:'TRENDHIVE payment failed',text:'Update your payment method to keep your subscription active.'});await outbox(tx,'notification',{userId:u.id,type:'payment.failed',title:'Payment failed',body:'Please update your payment method.'});}
                    if (paymentObject && e.type === 'subscription.charged') {
                        const amount = Number(paymentObject.amount);
                        assert(Number.isSafeInteger(amount) && amount >= 0, 400, 'INVALID_AMOUNT', 'Invalid provider amount.');
                        const p = await tx.payment.upsert({ where: { providerPaymentId: `razorpay:${String(paymentObject.id)}` }, create: { userId: local.userId, subscriptionId: local.id, provider, providerPaymentId: `razorpay:${String(paymentObject.id)}`, amountMinor: amount, currency: String(paymentObject.currency), status: 'PAID' }, update: {} });
                        const billing=await tx.brandProfile.findUnique({where:{userId:local.userId}});
                        await tx.invoice.upsert({ where: { paymentId: p.id }, create: { paymentId: p.id, number: `TH-${p.id}`, gstin:billing?.gstin,billingAddress:billing?.billingAddress,billingName: billing?.billingName??(await tx.user.findUniqueOrThrow({ where: { id: local.userId } })).name }, update: {} });
                    }
                }
            }
            await tx.webhookEvent.update({ where: { id: record.id }, data: { processedAt: new Date() } });
            return { received: true, duplicate: false };
        });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const event = await db.webhookEvent.findUnique({ where: { provider_eventId: { provider, eventId: e.id } } });
            if (event?.processedAt && event.payloadHash === hash(body))
                return { received: true, duplicate: true };
        }
        throw error;
    }
}
export async function requestPayout(user: User, amountMinor: number, key: string) {
    const creator = await creatorFor(user);
    assert(creator.payoutDetailsEncrypted, 400, 'PAYOUT_DETAILS_REQUIRED', 'Save your payout details first.');
    return transaction(async (tx) => {
        const existing = await tx.payout.findUnique({ where: { idempotencyKey: key } });
        if (existing) {
            assert(existing.creatorId === creator.id && existing.amountMinor === amountMinor, 409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key is already used.');
            return existing;
        }
        const wallet = await tx.wallet.findUnique({ where: { creatorId: creator.id } });
        assert(wallet && wallet.availableMinor >= amountMinor, 409, 'INSUFFICIENT_FUNDS', 'Insufficient available balance.');
        const p = await tx.payout.create({ data: { creatorId: creator.id, amountMinor, currency: wallet.currency, idempotencyKey: key, detailsEncrypted: creator.payoutDetailsEncrypted! } });
        await tx.wallet.update({ where: { id: wallet.id }, data: { availableMinor: { decrement: amountMinor }, reservedMinor: { increment: amountMinor } } });
        await tx.ledgerEntry.createMany({ data: [{ walletId: wallet.id, transactionId: `reserve:${p.id}`, account: 'CREATOR_AVAILABLE', amountMinor: -amountMinor, reference: p.id }, { walletId: wallet.id, transactionId: `reserve:${p.id}`, account: 'CREATOR_RESERVED', amountMinor, reference: p.id }] });
        await outbox(tx, 'notification', { userId: user.id, type: 'payout.requested', title: 'Payout requested', body: `${amountMinor / 100} ${wallet.currency}` });
        return p;
    });
}
export async function transitionPayout(id: string, status: 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED', reference?: string, reason?: string) {
    return transaction(async (tx) => {
        const p = await tx.payout.findUnique({ where: { id }, include: { creator: true } });
        assert(p && !p.deletedAt, 404, 'NOT_FOUND', 'Payout not found.');
        const transitions: Record<string, string[]> = { REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['PROCESSING', 'REJECTED'], PROCESSING: ['PAID', 'FAILED'] };
        assert(transitions[p.status]?.includes(status), 409, 'INVALID_TRANSITION', 'Payout cannot make this transition.');
        if (status === 'PAID')
            assert(reference, 400, 'REFERENCE_REQUIRED', 'Provide the settlement reference.');
        if (['PAID', 'FAILED', 'REJECTED'].includes(status)) {
            const w = await tx.wallet.findUniqueOrThrow({ where: { creatorId: p.creatorId } });
            assert(w.reservedMinor >= p.amountMinor, 409, 'LEDGER_CONFLICT', 'Reserved balance is inconsistent.');
            const returned = status !== 'PAID';
            await tx.wallet.update({ where: { id: w.id }, data: { reservedMinor: { decrement: p.amountMinor }, ...(returned ? { availableMinor: { increment: p.amountMinor } } : {}) } });
            await tx.ledgerEntry.createMany({ data: [{ walletId: w.id, transactionId: `settle:${p.id}`, account: 'CREATOR_RESERVED', amountMinor: -p.amountMinor, reference: p.id }, { walletId: w.id, transactionId: `settle:${p.id}`, account: returned ? 'CREATOR_AVAILABLE' : 'BANK_SETTLED', amountMinor: p.amountMinor, reference: p.id }] });
        }
        const updated = await tx.payout.update({ where: { id }, data: { status, providerReference: reference, failureReason: reason } });
        await outbox(tx, 'notification', { userId: p.creator.userId, type: `payout.${status.toLowerCase()}`, title: `Payout ${status.toLowerCase()}`, body: reason ?? reference ?? 'Your payout status has changed.' });
        return updated;
    });
}
export const safePayout = <T extends {
    detailsEncrypted: string;
}>(p: T) => { const { detailsEncrypted: _, ...safe } = p; return safe; };

export async function checkout(user:User,input:{provider:'stripe'|'razorpay';billing:'monthly'|'annual';plan:'SELF_SERVICE'|'FULL_SERVICE'},idempotencyKey:string){
  const requestHash=hash(JSON.stringify(input));
  const reserved=await transaction(async tx=>{
    // Local expiry never proves that the provider created no subscription.
    await tx.checkoutAttempt.updateMany({where:{userId:user.id,status:'CHECKOUT_CREATED',expiresAt:{lte:new Date()}},data:{status:'RECONCILE_REQUIRED'}});
    const previous=await tx.checkoutAttempt.findUnique({where:{userId_idempotencyKey:{userId:user.id,idempotencyKey}}});
    if(previous){assert(previous.requestHash===requestHash,409,'IDEMPOTENCY_CONFLICT','Checkout key is already used for another request.');return {attempt:previous,start:false};}
    const active=await tx.checkoutAttempt.findFirst({where:{userId:user.id,status:{in:['PROCESSING','CHECKOUT_CREATED','RECONCILE_REQUIRED']}}});
    if(active){assert(active.requestHash===requestHash,409,'CHECKOUT_PENDING','Complete or reconcile the existing checkout first.');return {attempt:active,start:false};}
    return {attempt:await tx.checkoutAttempt.create({data:{userId:user.id,idempotencyKey,requestHash,provider:input.provider,expiresAt:new Date(Date.now()+86400000)}}),start:true};
  });
  if(reserved.attempt.response&&['CHECKOUT_CREATED','COMPLETED'].includes(reserved.attempt.status))return reserved.attempt.response;
  assert(reserved.start,409,'CHECKOUT_PENDING','A checkout is already being processed. Reconcile its outcome before another attempt.');
  try{
    const response=await createProviderCheckout(user,input,reserved.attempt.id);
    await db.checkoutAttempt.update({where:{id:reserved.attempt.id},data:{response:response as Prisma.InputJsonValue}});
    await db.checkoutAttempt.updateMany({where:{id:reserved.attempt.id,status:'PROCESSING'},data:{status:'CHECKOUT_CREATED'}});return response;
  }catch(error){
    const definite=error instanceof AppError&&(error.status<500||['BILLING_UNAVAILABLE','PRICE_UNAVAILABLE'].includes(error.code));
    await db.checkoutAttempt.updateMany({where:{id:reserved.attempt.id,status:'PROCESSING'},data:{status:definite?'FAILED':'RECONCILE_REQUIRED',lastError:error instanceof Error?error.message.slice(0,500):'Provider outcome is uncertain'}});
    throw error;
  }
}
