import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPngMetadata } from './clean-media-metadata.mjs';
const chunk = (type, data = Buffer.alloc(0)) => {
  const out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length);
  out.write(type, 4, 'ascii'); data.copy(out, 8); return out;
};
void test('metadata cleaning preserves exact image chunks and original copyright', () => {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const image = chunk('IDAT', Buffer.from([1, 2, 3, 4])), end = chunk('IEND');
  const copyright = chunk('tEXt', Buffer.from('Copyright: licensed third party'));
  const input = Buffer.concat([header, chunk('caBX', Buffer.from('OpenAI')), copyright, image, end]);
  const result = cleanPngMetadata(input);
  assert.deepEqual(result.output, Buffer.concat([header, copyright, image, end]));
  assert.deepEqual(result.removed, ['caBX']);
  assert.equal(cleanPngMetadata(result.output).pixelSha256, result.pixelSha256);
});
void test('metadata cleaning rejects truncated chunks', () => {
  assert.throws(() => cleanPngMetadata(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1])), /truncado/);
});
