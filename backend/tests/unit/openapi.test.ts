jest.mock('../../src/core/http', () => ({ registry: [] }));
import { z } from 'zod';
import { registry } from '../../src/core/http';
import { openapi } from '../../src/openapi';

test('OpenAPI conversion preserves required fields, enums and numeric limits', () => {
    registry.push({ method: 'post', path: '/schema-check', summary: 'Schema conversion regression',
        query: z.object({ limit: z.coerce.number().int().min(1).max(100).optional(), status: z.enum(['LIVE', 'DRAFT']) }),
        schema: z.object({ title: z.string().min(3), budget: z.number().int().positive() }),
        handler: async () => undefined });
    try {
        const document = JSON.parse(JSON.stringify(openapi())) as {
            paths: Record<string, { post: { parameters: unknown[]; requestBody: { content: { 'application/json': { schema: unknown } } } } }>;
        };
        const operation = document.paths['/api/v1/schema-check']!.post;
        expect(operation.parameters).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'limit', required: false, schema: expect.objectContaining({ minimum: 1, maximum: 100 }) }),
            expect.objectContaining({ name: 'status', required: true, schema: expect.objectContaining({ enum: ['LIVE', 'DRAFT'] }) }),
        ]));
        expect(operation.requestBody.content['application/json'].schema).toMatchObject({
            required: ['title', 'budget'], properties: { title: { type: 'string', minLength: 3 }, budget: { type: 'integer', minimum: 0, exclusiveMinimum: true } },
        });
    } finally { registry.pop(); }
});
