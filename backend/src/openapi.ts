import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodType } from 'zod';
import { registry } from './core/http';

// This adapter preserves Zod input checking while avoiding the converter's
// recursive generic comparison (TS2589) against Zod's schema methods.
const toOpenApiSchema = zodToJsonSchema as unknown as (schema: ZodType<unknown>, options: { target: 'openApi3' }) => object;
type Published={paths:Record<string,Record<string,{responses?:unknown}>>;components:{schemas:Record<string,unknown>}};
const published=JSON.parse(readFileSync(join(__dirname,'..','openapi.json'),'utf8')) as Published;
export function openapi() {
    const paths: Record<string, Record<string, unknown>> = {};
    for (const r of registry) {
        const path = '/api/v1' + r.path.replace(/:([A-Za-z]+)/g, '{$1}');
        const parameters: unknown[] = [...[...r.path.matchAll(/:([A-Za-z]+)/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }))];
        if (r.query) {
            const json = toOpenApiSchema(r.query, { target: 'openApi3' }) as {
                properties?: Record<string, unknown>;
                required?: string[];
            };
            for (const [name, schema] of Object.entries(json.properties ?? {}))
                parameters.push({ name, in: 'query', required: json.required?.includes(name) ?? false, schema });
        }
        const schema = r.schema ? toOpenApiSchema(r.schema, { target: 'openApi3' }) : undefined;
        paths[path] ??= {};
        paths[path]![r.method] = { operationId: r.method + '_' + r.path.replace(/[^a-zA-Z0-9]/g, '_'), summary: r.summary, tags: [r.path.split('/')[1]], ...(r.auth || r.roles ? { security: [{ bearerAuth: [] }, { cookieAuth: [] }] } : {}), ...(r.roles ? { 'x-roles': r.roles } : {}), parameters, ...(schema ? { requestBody: { required: true, content: { 'application/json': { schema } } } } : {}), responses: published.paths[path]?.[r.method]?.responses ?? { '200': { description: 'Success envelope', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' } } } }, '201': { description: 'Created' }, '400': { description: 'Validation failed' }, '401': { description: 'Authentication required' }, '403': { description: 'Permission denied' }, '409': { description: 'State conflict' }, '429': { description: 'Rate limited' } } };
    }
    for (const provider of ['stripe', 'razorpay'])
        paths[`/api/v1/payments/webhooks/${provider}`] = { post: { summary: `Signed ${provider} webhook (raw JSON)`, parameters: [{ name: provider === 'stripe' ? 'stripe-signature' : 'x-razorpay-signature', in: 'header', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } }, responses: { '200': { description: 'Acknowledged' }, '400': { description: 'Signature rejected' } } } };
    return { openapi: '3.0.3', info: { title: 'TRENDHIVE API', version: '1.0.0', description: 'by onetrendsetter. Money accounting fields are integer minor units. Cookie auth requires X-CSRF-Token for writes. Use Idempotency-Key on checkout/refunds/payouts.' }, servers: [{ url: '/' }], paths, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, cookieAuth: { type: 'apiKey', in: 'cookie', name: 'th_access' } }, schemas: { ...published.components.schemas, Envelope: { type: 'object', required: ['success', 'data', 'error', 'meta'], properties: { success: { type: 'boolean' }, data: { nullable: true }, error: { nullable: true, type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } }, meta: { nullable: true, type: 'object' } } } } } };
}
