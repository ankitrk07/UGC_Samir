import type { Prisma } from '@prisma/client';
import { db, transaction } from '../../core/db';
import { assert } from '../../core/http';
import { stripe, razorpay } from './service';
export async function requestRefund(paymentId: string, amountMinor: number, key: string, reason: string, actorId: string) {
    return transaction(async (tx) => {
        const previous = await tx.refund.findUnique({ where: { idempotencyKey: key } });
        if (previous) {
            assert(previous.paymentId === paymentId && previous.amountMinor === amountMinor, 409, 'IDEMPOTENCY_CONFLICT', 'Refund key already used.');
            return previous;
        }
        const p = await tx.payment.findUnique({ where: { id: paymentId } });
        assert(p && p.status === 'PAID', 404, 'NOT_FOUND', 'Paid payment not found.');
        const pending = await tx.refund.aggregate({ where: { paymentId, status: { in: ['REQUESTED', 'PROCESSING'] } }, _sum: { amountMinor: true } });
        assert(amountMinor <= p.amountMinor - p.refundedMinor - (pending._sum.amountMinor ?? 0), 409, 'REFUND_EXCEEDS_BALANCE', 'Refund exceeds the unreserved payment balance.');
        const refund = await tx.refund.create({ data: { paymentId, amountMinor, idempotencyKey: key, reason, status: 'REQUESTED' } });
        await tx.outboxEvent.create({ data: { type: 'refund.process', payload: { refundId: refund.id } } });
        await tx.auditLog.create({ data: { actorId, action: 'REFUND_REQUESTED', resource: 'Payment', resourceId: paymentId, details: { refundId: refund.id, amountMinor, reason } } });
        return refund;
    });
}
export async function reconcileRefund(tx: Prisma.TransactionClient, id: string, status: string, providerRefundId: string, expectedAmountMinor?: number, expectedCurrency?: string, expectedProvider?: string) {
    const refund = await tx.refund.findUnique({ where: { id }, include: { payment: true } });
    if (!refund || refund.status === 'SUCCEEDED')
        return;
    assert(!refund.providerRefundId || refund.providerRefundId === providerRefundId, 409, 'REFUND_BINDING_MISMATCH', 'Refund provider identity does not match.');
    assert(expectedProvider === undefined || expectedProvider === refund.payment.provider, 409, 'REFUND_BINDING_MISMATCH', 'Refund belongs to another payment provider.');
    assert(expectedAmountMinor === undefined || expectedAmountMinor === refund.amountMinor, 409, 'REFUND_AMOUNT_MISMATCH', 'Provider refund amount does not match the reserved request.');
    assert(expectedCurrency === undefined || expectedCurrency.toUpperCase() === refund.payment.currency.toUpperCase(), 409, 'CURRENCY_MISMATCH', 'Provider refund currency does not match.');
    const next = status === 'succeeded' || status === 'processed' ? 'SUCCEEDED' : status === 'failed' || status === 'canceled' ? 'FAILED' : 'PROCESSING';
    if (next === 'SUCCEEDED') {
        assert(refund.payment.refundedMinor + refund.amountMinor <= refund.payment.amountMinor, 409, 'REFUND_CONFLICT', 'Provider refund exceeds payment balance.');
        await tx.payment.update({ where: { id: refund.paymentId }, data: { refundedMinor: { increment: refund.amountMinor }, ...(refund.payment.refundedMinor + refund.amountMinor === refund.payment.amountMinor ? { status: 'REFUNDED' } : {}) } });
    }
    await tx.refund.update({ where: { id }, data: { status: next, providerRefundId } });
}
export async function processRefund(id: string) {
    const refund = await db.refund.findUnique({ where: { id }, include: { payment: true } });
    if (!refund || ['SUCCEEDED', 'FAILED'].includes(refund.status))
        return;
    const p = refund.payment;
    let result: {
        id: string;
        status: string | null;
    };
    if (p.provider === 'stripe') {
        const invoice = await stripe().invoices.retrieve(p.providerPaymentId.replace(/^stripe:/, ''), { expand: ['payments'] });
        const raw = invoice as unknown as {
            payments?: {
                data?: {
                    payment?: {
                        payment_intent?: string;
                    };
                }[];
            };
            payment_intent?: string;
        };
        const intent = raw.payment_intent ?? raw.payments?.data?.[0]?.payment?.payment_intent;
        assert(intent, 409, 'PAYMENT_INTENT_UNAVAILABLE', 'Invoice has no refundable payment intent.');
        const response = await stripe().refunds.create({ payment_intent: intent, amount: refund.amountMinor, metadata: { trendhiveRefundId: id } }, { idempotencyKey: 'refund:' + id });
        result = { id: response.id, status: response.status };
    }
    else {
        const paymentId = encodeURIComponent(p.providerPaymentId.replace(/^razorpay:/, ''));
        if (refund.attemptedAt) {
            const list = await razorpay('payments/' + paymentId + '/refunds', 'GET');
            const found = (list.items as {
                id: string;
                status: string;
                notes?: {
                    trendhiveRefundId?: string;
                };
            }[] | undefined)?.find(x => x.notes?.trendhiveRefundId === id);
            assert(found, 409, 'REFUND_RECONCILIATION_REQUIRED', 'Prior Razorpay request has an uncertain outcome. Reconcile in provider dashboard before another attempt.');
            result = found;
        }
        else {
            // A stalled BullMQ job may be delivered again while an old worker still runs.
            // Claim the first provider attempt atomically; Razorpay refunds have no
            // payout-idempotency guarantee and must not be posted twice.
            const claimed = await db.refund.updateMany({ where: { id, attemptedAt: null, status: 'REQUESTED' }, data: { attemptedAt: new Date(), status: 'PROCESSING' } });
            assert(claimed.count === 1, 409, 'REFUND_RECONCILIATION_REQUIRED', 'Another worker claimed this refund. Reconcile its provider outcome before another attempt.');
            const response = await razorpay('payments/' + paymentId + '/refund', 'POST', { amount: refund.amountMinor, notes: { trendhiveRefundId: id, reason: refund.reason } });
            result = { id: String(response.id), status: String(response.status) };
        }
    }
    await transaction(tx => reconcileRefund(tx, id, result.status ?? 'pending', result.id));
}
