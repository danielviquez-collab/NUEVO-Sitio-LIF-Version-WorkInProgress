import type { IncomingMessage, ServerResponse } from 'node:http';

export function localApiBridge(
  handler: (request: Request) => Promise<Response>,
) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (
      !req.url ||
      (!req.url.startsWith('/api/games/') &&
        req.url.split('?')[0] !== '/api/contact')
    )
      return next();
    const send = (status: number, error: string) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error }));
    };
    const host = req.headers.host;
    if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
      return send(403, 'ORIGIN_INVALID');
    const url = new URL(req.url, `http://${host}`);
    if (url.host !== host) return send(403, 'ORIGIN_INVALID');
    try {
      const body: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > 1000000) return send(413, 'PAYLOAD_TOO_LARGE');
        body.push(bytes);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined)
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      const response = await handler(
        new Request(url, {
          method: req.method,
          headers,
          ...(size && !['GET', 'HEAD'].includes(req.method ?? '')
            ? { body: Buffer.concat(body) }
            : {}),
        }),
      );
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    } catch {
      send(503, 'STORAGE_UNAVAILABLE');
    }
  };
}
