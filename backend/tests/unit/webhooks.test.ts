jest.mock('../../src/core/db', () => ({ db: {}, transaction: jest.fn(), outbox: jest.fn() }));
import Stripe from 'stripe';
import { createHmac } from 'node:crypto';
import { verifyWebhook } from '../../src/modules/payments/service';
describe('provider signature validation', () => {
    test('Stripe signs exact raw bytes and enforces timestamps', () => { const payload = JSON.stringify({ id: 'evt_1', type: 'invoice.paid', data: { object: { id: 'in_1' } } }); const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_fixture' }); expect(verifyWebhook('stripe', Buffer.from(payload), header)).toMatchObject({ id: 'evt_1', type: 'invoice.paid' }); expect(() => verifyWebhook('stripe', Buffer.from(payload + ' '), header)).toThrow(); const old = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_fixture', timestamp: 1 }); expect(() => verifyWebhook('stripe', Buffer.from(payload), old)).toThrow(); });
    test('Razorpay uses HMAC SHA256 and retains refund notes', () => { const payload = Buffer.from(JSON.stringify({ event: 'refund.processed', payload: { refund: { entity: { id: 'rf_1', notes: { trendhiveRefundId: 'r1' }, status: 'processed' } } } })); const signature = createHmac('sha256', 'razorpay_test_fixture').update(payload).digest('hex'); expect(verifyWebhook('razorpay', payload, signature, 'event_1')).toMatchObject({ id: 'event_1', object: { id: 'rf_1', notes: { trendhiveRefundId: 'r1' } } }); expect(() => verifyWebhook('razorpay', payload, 'invalid')).toThrow(); });
});
