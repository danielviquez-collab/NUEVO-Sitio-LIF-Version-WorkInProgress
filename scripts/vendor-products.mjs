import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { flavors } from '../lib/lif-content.ts';

await mkdir('public/products', { recursive: true });
for (const flavor of flavors) {
  if (!flavor.image?.startsWith('https://lif.cr/wp-content/uploads/')) continue;
  const destination = resolve('public/products', `${flavor.slug}.png`);
  const existing = await stat(destination).catch(() => null);
  if (existing?.size) continue;
  const response = await fetch(flavor.image, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${flavor.slug}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${flavor.slug}: expected PNG`);
  await writeFile(destination, bytes);
  console.log(`${flavor.slug}: ${bytes.length} bytes`);
}
