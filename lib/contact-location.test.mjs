import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import catalog from './costa-rica-locations.json' with { type: 'json' };
import { provinces, cantonsForProvince, districtsForCanton, validateContactLocation, contactLocationLabels } from './contact-location.ts';
import { CompetitionStore } from './gaming/server.ts';
import { exportCompetitionState, importCompetitionState } from './gaming/competition-state.ts';

test('Official cached catalog includes every province, canton and district without duplicate codes', () => {
  assert.equal(provinces.length, 7);
  assert.equal(catalog.cantons.length, 84);
  assert.equal(catalog.districts.length, 494);
  for (const items of [provinces, catalog.cantons, catalog.districts])
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(provinces.reduce((count, province) => count + cantonsForProvince(province.id).length, 0), 84);
  assert.equal(catalog.cantons.reduce((count, canton) => count + districtsForCanton(canton.id).length, 0), 494);
  for (const province of provinces)
    for (const canton of cantonsForProvince(province.id))
      for (const district of districtsForCanton(canton.id)) {
        const location = { province: province.id, canton: canton.id, district: district.id };
        assert.deepEqual(validateContactLocation(location), location);
        assert.deepEqual(contactLocationLabels(location), { province: province.label, canton: canton.label, district: district.label });
      }
  assert.deepEqual(cantonsForProvince('unknown'), []);
  assert.deepEqual(districtsForCanton('unknown'), []);
});

test('Residence is optional and valid partial selections never require another field', () => {
  assert.deepEqual(validateContactLocation({}), { province: '', canton: '', district: '' });
  for (const value of [{ province: '1' }, { province: '1', canton: '115' }, { province: '1', canton: '115', district: '11501' }])
    assert.deepEqual(validateContactLocation(value), { province: '', canton: '', district: '', ...value });
  assert.deepEqual(contactLocationLabels({ province: '1', canton: '115', district: '11501' }), { province: 'San José', canton: 'Montes de Oca', district: 'San Pedro' });
});

test('Unknown, malformed and mismatched residence codes cannot be stored', () => {
  for (const location of [
    { province: 'San José' }, { province: 1 }, { province: null }, { canton: '115' },
    { district: '11501' }, { province: '1', canton: '201' },
    { province: '1', canton: '115', district: '10101' },
    { province: '9' }, { province: '1', canton: '199' },
  ]) assert.throws(() => validateContactLocation(location), /INPUT_INVALID/);
});

const contact = location => ({ request: randomUUID(), name: 'Prueba local', email: 'qa@example.test', message: 'Mensaje de prueba aislado.', consent: true, ...location });
test('Contacts save full, partial or absent residence and retries preserve the original record', () => {
  const store = new CompetitionStore(':memory:');
  try {
    for (const location of [{}, { province: '1' }, { province: '1', canton: '115', district: '11501' }]) {
      const message = contact(location), saved = store.contact(message);
      assert.deepEqual(store.contact(message), saved);
      const row = store.db.prepare('SELECT province,canton,district FROM contact_messages WHERE id=?').get(saved.id);
      assert.deepEqual({ ...row }, validateContactLocation(location));
    }
    assert.equal(store.db.prepare('SELECT COUNT(*) n FROM contact_messages').get().n, 3);
    assert.throws(() => store.contact(contact({ province: '1', canton: '201' })), /INPUT_INVALID/);
    assert.equal(store.db.prepare('SELECT COUNT(*) n FROM contact_messages').get().n, 3);
  } finally { store.db.close(); }
});

test('Existing local databases gain only optional columns without losing prior contact history', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lif-contact-location-')), path = join(dir, 'history.sqlite');
  const legacy = new DatabaseSync(path), id = randomUUID(), request = randomUUID(), created = Date.now();
  legacy.exec('CREATE TABLE contact_messages(id TEXT PRIMARY KEY,request TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consent INTEGER NOT NULL,created INTEGER NOT NULL)');
  legacy.prepare('INSERT INTO contact_messages VALUES(?,?,?,?,?,?,?,?)').run(id, request, 'Anterior', 'old@example.test', '', 'Mensaje anterior.', 1, created);
  legacy.close();
  const store = new CompetitionStore(path);
  try {
    const row = store.db.prepare('SELECT * FROM contact_messages WHERE id=?').get(id);
    assert.deepEqual({ ...row }, { id, request, name: 'Anterior', email: 'old@example.test', phone: '', message: 'Mensaje anterior.', consent: 1, created, province: '', canton: '', district: '' });
  } finally { store.db.close(); rmSync(dir, { recursive: true }); }
});

test('Netlify restores legacy contacts and retains residence across cold invocations', () => {
  const first = new CompetitionStore(':memory:'), restored = new CompetitionStore(':memory:');
  try {
    const old = first.contact(contact({})), current = first.contact(contact({ province: '1', canton: '115', district: '11501' }));
    const snapshot = JSON.parse(exportCompetitionState(first));
    for (const key of ['province', 'canton', 'district']) delete snapshot.tables.contact_messages.find(row => row.id === old.id)[key];
    importCompetitionState(restored, JSON.stringify(snapshot));
    assert.equal(restored.db.prepare('SELECT province FROM contact_messages WHERE id=?').get(old.id).province, '');
    assert.equal(restored.db.prepare('SELECT district FROM contact_messages WHERE id=?').get(current.id).district, '11501');
    const invalid = JSON.parse(exportCompetitionState(first));
    invalid.tables.contact_messages[0].unexpected = 'not an accepted migration';
    const empty = new CompetitionStore(':memory:');
    try {
      assert.throws(() => importCompetitionState(empty, JSON.stringify(invalid)), /STATE_CORRUPT/);
      assert.equal(empty.db.prepare('SELECT COUNT(*) n FROM contact_messages').get().n, 0);
    } finally { empty.db.close(); }
  } finally { first.db.close(); restored.db.close(); }
});
