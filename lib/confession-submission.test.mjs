import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confessionPayload, submitConfession, validateVideoFile, MAX_VIDEO_BYTES } from './confession-submission.ts';

const input = { confession: ' Una historia de prueba. ', alias: ' Alias ', consent: true, website: '' };
test('confessions require nonempty text, bounded length and consent', () => {
  const result = confessionPayload(input, 'test-id');
  assert.equal(result.confession, 'Una historia de prueba.');
  assert.equal(result.alias, 'Alias');
  for (const invalid of [{ confession: '   ' }, { confession: 'a'.repeat(5001) }, { alias: 'a'.repeat(33) }, { consent: false }, { website: 'spam' }]) {
    assert.throws(() => confessionPayload({ ...input, ...invalid }, 'test-id'));
  }
});

test('without an endpoint there is no send and no false acknowledgement', async () => {
  await assert.rejects(submitConfession(confessionPayload(input, 'test-id'), undefined, new AbortController().signal), /no se envió/);
});

test('success requires an explicit durable-write acknowledgement for the same id', async (context) => {
  const payload = confessionPayload(input, 'test-id');
  let response = { ok: true, id: 'wrong-id' };
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(response)));
  const signal = new AbortController().signal;
  await assert.rejects(submitConfession(payload, '/test-confessions', signal), /confirmar/);
  response = { ok: true, id: 'test-id' };
  await submitConfession(payload, '/test-confessions', signal);
  const options = fetchMock.mock.calls.at(-1).arguments[1];
  assert.equal(options.method, 'POST');
  assert.equal(options.signal, signal);
  assert.equal(JSON.parse(options.body).id, 'test-id');
  assert.equal(options.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.equal(options.redirect, 'follow');
});

test('a video can be submitted with or without a written story', () => {
  const video = { name: 'mi-historia.mp4', type: 'video/mp4', size: 1024, base64: 'test' };
  const payload = confessionPayload({ ...input, confession: '', video }, 'test-id');
  assert.equal(payload.video, video);
  assert.equal(payload.confession, '');
  assert.throws(() => confessionPayload({ ...input, confession: '', video, consent: false }, 'test-id'));
});

test('file validation rejects oversized, empty and non-video attachments', () => {
  const video = { name: 'test.mp4', type: 'video/mp4', size: 1024 };
  assert.doesNotThrow(() => validateVideoFile(video));
  assert.doesNotThrow(() => validateVideoFile({ ...video, type: '', name: 'iphone.MOV' }));
  for (const invalid of [{ size: 0 }, { size: MAX_VIDEO_BYTES + 1 }, { type: 'application/pdf' }, { name: 'evil.html' }]) {
    assert.throws(() => validateVideoFile({ ...video, ...invalid }));
  }
});

test('failed responses never become success', async (context) => {
  const payload = confessionPayload(input, 'test-id');
  context.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(submitConfession(payload, '/test-confessions', new AbortController().signal), /confirmar/);
});

test('network failures use a readable message, while cancellation is preserved', async (context) => {
  const payload = confessionPayload(input, 'test-id');
  const error = new TypeError('Failed to fetch');
  context.mock.method(globalThis, 'fetch', async () => { throw error; });
  const controller = new AbortController();
  await assert.rejects(submitConfession(payload, '/test-confessions', controller.signal), /confirmar/);
  controller.abort();
  await assert.rejects(submitConfession(payload, '/test-confessions', controller.signal), error);
});
