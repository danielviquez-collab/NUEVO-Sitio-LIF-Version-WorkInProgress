import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import robots from '../app/robots.ts';
import sitemap from '../app/sitemap.ts';
import { confessionStories } from '../lib/confession-stories.ts';

const root = new URL('../', import.meta.url).pathname;
const output = join(root, 'dist/client');
const policy = robots();
const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
const robotsText = rules.flatMap((rule) => [
  `User-agent: ${rule.userAgent}`,
  ...(rule.allow ? [`Allow: ${rule.allow}`] : []),
  ...(rule.disallow ? [`Disallow: ${rule.disallow}`] : []),
]);
robotsText.push(`Sitemap: ${policy.sitemap}`, '');
await writeFile(join(output, 'robots.txt'), robotsText.join('\n'));
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const urls = sitemap().map((page) => `  <url><loc>${escape(page.url)}</loc><changefreq>${page.changeFrequency}</changefreq><priority>${page.priority}</priority></url>`);
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

async function files(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    result.push(...(item.isDirectory() ? await files(path) : [path]));
  }
  return result;
}
const hash = (data) => createHash('sha256').update(data).digest('hex');
const publicRoot = join(root, 'public');
const assets = await files(publicRoot);
for (const path of assets) {
  const name = relative(publicRoot, path);
  if (hash(await readFile(path)) !== hash(await readFile(join(output, name)))) {
    throw new Error(`Asset missing or changed during export: ${name}`);
  }
}
const routes = ['index', 'sabores', 'recetario', 'confesiones', 'confesiones/todas', 'gracias-confesion', 'juega', ...confessionStories.map(({slug}) => `confesiones/${slug}`)];
for (const route of routes) {
  for (const extension of ['html', 'rsc']) {
    if (!(await stat(join(output, `${route}.${extension}`))).size) throw new Error(`Empty route: ${route}.${extension}`);
  }
}
await stat(join(output, '404.html'));
const cssFiles = (await files(join(output, '_next/static/css'))).filter((path) => path.endsWith('.css'));
const compiledCss = (await Promise.all(cssFiles.map((path) => readFile(path, 'utf8')))).join('\n');
for (const selector of ['.lif-game-dialog', '.game-experience', '.game-roulette-wheel']) {
  if (!compiledCss.includes(selector)) throw new Error(`Missing compiled game styles: ${selector}`);
}
console.log(JSON.stringify({ routes: routes.length, identicalPublicAssets: assets.length, metadata: ['robots.txt', 'sitemap.xml'], status: 'verified' }));
