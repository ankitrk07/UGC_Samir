process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://trendhive:trendhive@localhost:5432/trendhive_test';
process.env.REDIS_URL ??= 'redis://localhost:6379/15';
// setupFiles executes before application modules can create Prisma/BullMQ clients.
// Reject unsafe inherited connections before any imports can touch real services.
if (!new URL(process.env.DATABASE_URL).pathname.endsWith('_test') || new URL(process.env.REDIS_URL).pathname !== '/15')
    throw new Error('Tests require an isolated *_test PostgreSQL database and Redis DB 15.');
process.env.JWT_SECRET = 'test-only-jwt-secret-at-least-32-characters';
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.LOG_LEVEL = 'silent';
process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fixture';
process.env.RAZORPAY_WEBHOOK_SECRET = 'razorpay_test_fixture';

process.env.RAZORPAY_KEY_ID = 'rzp_test_fixture';
process.env.RAZORPAY_KEY_SECRET = 'razorpay_key_fixture';

// Transport fixture only; tests do not deliver real email.
process.env.SMTP_HOST = 'smtp.test.invalid';
process.env.SMTP_PORT = '1025';
process.env.EMAIL_FROM = 'TRENDHIVE <test@example.invalid>';
process.env.SMTP_USER = '';
process.env.SMTP_PASSWORD = '';
