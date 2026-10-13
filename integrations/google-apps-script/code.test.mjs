import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const sample = { id: '12345678-abcd-test', confession: 'Una prueba.', alias: 'Alias', consent: true, consentVersion: '2026-09', source: 'lif-confesiones' };
const bytes = Buffer.concat([Buffer.from([0, 0, 0, 20]), Buffer.from('ftypisom'), Buffer.alloc(8)]);
const video = { name: 'prueba.mp4', type: 'video/mp4', size: bytes.length, base64: bytes.toString('base64') };

function setup() {
  const records = [], files = [], props = new Map([['LIF_FOLDER_ID', 'private-folder']]);
  const state = { fail: false, released: 0 };
  let context;
  const sheet = {
    getLastRow: () => records.length + 1,
    getRange: () => ({ getValues: () => [vm.runInContext('LIF_HEADERS', context)], createTextFinder: id => ({ matchEntireCell() { return this; }, useRegularExpression() { return this; }, findNext: () => records.some(row => row[0] === id) }) }),
    appendRow: row => { if (state.fail) throw new Error('sheet error'); records.push(row); },
  };
  context = vm.createContext({
    console,
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush: () => {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props.get(key), setProperty: (key, value) => props.set(key, value) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, hasLock: () => true, releaseLock: () => state.released++ }) },
    Utilities: { base64Decode: data => [...Buffer.from(data, 'base64')], newBlob: (data, type, name) => ({ data, type, name }), formatDate: () => '2026-09-26' },
    DriveApp: { getFolderById: () => ({ getFilesByName: () => ({ hasNext: () => false }), createFile: blob => { const file = { ...blob, getUrl: () => 'https://drive.google.com/file/d/private-id/view', getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=private-id', setTrashed: () => { file.trashed = true; } }; files.push(file); return file; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
  });
  return { context, records, files, state, post(payload) { context.request = { postData: { contents: JSON.stringify(payload) } }; return vm.runInContext('doPost(request)', context); } };
}

test('text writes use server time, literal cells, moderation and a durable acknowledgement', () => {
  const service = setup(); vm.runInContext(code, service.context);
  const result = service.post({ ...sample, confession: '=IMPORTXML("x")', alias: '+formula' });
  assert.equal(result.ok, true); assert.equal(result.id, sample.id);
  assert.equal(service.records[0][3], '\'=IMPORTXML("x")');
  assert.equal(service.records[0][2], "'+formula");
  assert.equal(service.records[0][10], 'Pendiente de revision');
  assert.equal(service.files.length, 0);
  assert.equal(service.state.released, 1);
});

test('video files remain private and links are written to the same record; retries deduplicate', () => {
  const service = setup(); vm.runInContext(code, service.context);
  assert.equal(service.post({ ...sample, confession: '', video }).ok, true);
  assert.equal(service.records[0][4], 'Video');
  assert.match(service.records[0][6], /drive.google.com/);
  assert.match(service.records[0][7], /download/);
  assert.equal(service.files.length, 1);
  assert.equal(service.files[0].type, 'video/mp4');
  assert.equal(service.post({ ...sample, confession: '', video }).ok, true);
  assert.equal(service.records.length, 1); assert.equal(service.files.length, 1);
});

test('invalid content, consent and fake containers cannot write to Sheets or Drive', () => {
  const service = setup(); vm.runInContext(code, service.context);
  for (const invalid of [{ consent: false }, { confession: '' }, { confession: 'a'.repeat(5001) }, { website: 'spam' }, { video: { ...video, size: 30 } }, { video: { ...video, base64: Buffer.alloc(20).toString('base64') } }, { video: { ...video, name: 'test.html' } }]) {
    assert.equal(service.post({ ...sample, ...invalid }).ok, false);
  }
  assert.equal(service.records.length, 0); assert.equal(service.files.length, 0);
});

test('failed Sheet writes do not acknowledge success and remove the orphaned new file', () => {
  const service = setup(); vm.runInContext(code, service.context);
  service.state.fail = true;
  assert.equal(service.post({ ...sample, video }).ok, false);
  assert.equal(service.records.length, 0);
  assert.equal(service.files[0].trashed, true);
  assert.equal(service.state.released, 1);
});
