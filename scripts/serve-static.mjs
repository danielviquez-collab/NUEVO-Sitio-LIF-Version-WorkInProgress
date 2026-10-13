import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist/client');
const port = Number(process.env.PORT || 4175);
let gamesApi;
if (process.env.LIF_PREVIEW_GAMES_API === 'isolated') {
  const { CompetitionStore, competitionMiddleware } = await import('../lib/gaming/server.ts');
  gamesApi = competitionMiddleware(new CompetitionStore(':memory:'));
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.rsc': 'text/x-component', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (request, response) => {
  if (gamesApi && (request.url?.startsWith('/api/games/') || request.url === '/api/contact'))
    return gamesApi(request, response, () => response.writeHead(404).end());
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const base = resolve(root, `.${pathname}`);
    if (base !== root && !base.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    let selected;
    for (const candidate of [base, `${base}.html`, resolve(base, 'index.html')]) {
      try {
        const info = await stat(candidate);
        if (info.isFile()) { selected = { path: candidate, size: info.size }; break; }
      } catch { /* Try the next exported route form. */ }
    }
    if (!selected) {
      response.writeHead(404, { 'Content-Type': 'text/html' });
      createReadStream(resolve(root, '404.html')).pipe(response);
      return;
    }
    const headers = { 'Content-Type': types[extname(selected.path)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    let start = 0;
    let end = selected.size - 1;
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), end) : end;
      if (start > end || start >= selected.size) { response.writeHead(416).end(); return; }
      headers['Content-Range'] = `bytes ${start}-${end}/${selected.size}`;
    }
    response.writeHead(range ? 206 : 200, { ...headers, 'Content-Length': end - start + 1 });
    if (request.method === 'HEAD') response.end();
    else createReadStream(selected.path, { start, end }).pipe(response);
  } catch {
    response.writeHead(400).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Static release preview: http://localhost:${port}`));
