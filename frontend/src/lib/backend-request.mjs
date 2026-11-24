export class BridgeRequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function backendTarget(base, endpoint) {
  let url;
  try { url = new URL(base); } catch { throw new BridgeRequestError(503, 'Invalid service configuration.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !/^\/api\/v1\/?$/.test(url.pathname)) {
    throw new BridgeRequestError(503, 'Configure the API base URL ending in /api/v1.');
  }
  url.pathname = url.pathname.replace(/\/$/, '') + '/' + endpoint;
  return url;
}

export async function boundedJsonBody(request, limit = 32000) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
    throw new BridgeRequestError(413, 'That request is too large.');
  }
  if (!request.body) return {};
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new BridgeRequestError(415, 'Send JSON with application/json content type.');
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new BridgeRequestError(413, 'That request is too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    if (error instanceof BridgeRequestError) throw error;
    throw new BridgeRequestError(400, 'Send valid JSON.');
  } finally { reader.releaseLock(); }
}
