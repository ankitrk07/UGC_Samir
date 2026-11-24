export class BridgeRequestError extends Error { status: number; constructor(status: number, message: string); }
export function backendTarget(base: string, endpoint: string): URL;
export function boundedJsonBody(request: Request, limit?: number): Promise<unknown>;
