import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import vm from 'node:vm';

const code = ['Code.gs', 'Records.gs', 'State.gs']
  .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
  .join('\n');
const secret = 'test-only-private-secret-not-for-deployment';
function setup() {
  const sheets = new Map();
  const state = { writes: 0, failAt: 0, opens: 0 };
  function sheet() {
    const rows = [];
    return {
      rows,
      hidden: false,
      hideSheet() {
        this.hidden = true;
      },
      getLastRow: () => rows.length,
      getRange(row, column, height = 1, width = 1) {
        const range = {
          getValues: () =>
            Array.from({ length: height }, (_, index) =>
              Array.from(
                { length: width },
                (_, cell) => rows[row - 1 + index]?.[column - 1 + cell] ?? '',
              ),
            ),
          setValues(values) {
            state.writes++;
            if (state.writes === state.failAt)
              throw new Error('test interruption');
            values.forEach((value, index) => {
              const cells = rows[row - 1 + index] ?? [];
              value.forEach((cell, position) => {
                cells[column - 1 + position] = cell;
              });
              rows[row - 1 + index] = cells;
            });
            return range;
          },
          createTextFinder: (id) => ({
            matchEntireCell() {
              return this;
            },
            useRegularExpression() {
              return this;
            },
            findNext: () => {
              const index = rows.findIndex((values) => values[0] === id);
              return index < 0 ? null : { getRow: () => index + 1 };
            },
          }),
        };
        for (const name of [
          'setBackground',
          'setFontColor',
          'setFontWeight',
          'setNumberFormat',
          'setWrap',
        ])
          range[name] = () => range;
        return range;
      },
      appendRow(values) {
        this.getRange(rows.length + 1, 1).setValues([values]);
      },
      setFrozenRows() {},
      setColumnWidth() {},
      setColumnWidths() {},
    };
  }
  const book = {
    getSheetByName: (name) => sheets.get(name),
    insertSheet: (name) => {
      const value = sheet();
      sheets.set(name, value);
      return value;
    },
  };
  const context = vm.createContext({
    console,
    SpreadsheetApp: {
      openById: () => {
        state.opens++;
        return book;
      },
      flush() {},
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => (key === 'LIF_SHEETS_SYNC_KEY' ? secret : null),
      }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        hasLock: () => true,
        releaseLock() {},
      }),
    },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_, value) => [
        ...createHash('sha256').update(value).digest(),
      ],
      base64Encode: (value) => Buffer.from(value).toString('base64'),
      base64Decode: (value) => [...Buffer.from(value, 'base64')],
      newBlob: (value) => ({
        getDataAsString: () => Buffer.from(value).toString('utf8'),
      }),
      computeHmacSha256Signature: (value, key) => [
        ...createHmac('sha256', key).update(value).digest(),
      ],
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
    },
  });
  vm.runInContext(code, context);
  vm.runInContext('prepararJuegosYContactos()', context);
  state.writes = 0;
  return {
    sheets,
    state,
    context,
    post(action, body, changes = {}) {
      const issuedAt = Date.now(),
        serialized = JSON.stringify(body);
      const payload = {
        source: 'lif-client-tests',
        action,
        issuedAt,
        body: serialized,
        signature: createHmac('sha256', secret)
          .update(`${action}\n${issuedAt}\n${serialized}`)
          .digest('hex'),
        ...changes,
      };
      context.request = { postData: { contents: JSON.stringify(payload) } };
      return vm.runInContext('doPost(request)', context);
    },
  };
}

test('technical state is hidden and does not modify the existing record tabs', () => {
  const api = setup();
  const before = JSON.stringify([...api.sheets]);
  vm.runInContext('prepararEstadoJuegos()', api.context);
  assert.equal(api.sheets.get('EstadoJuegos').hidden, true);
  assert.deepEqual(api.sheets.get('EstadoJuegos').rows, [
    ['Revision', 'Parte', 'Contenido'],
  ]);
  assert.equal(
    JSON.stringify([...api.sheets].filter(([name]) => name !== 'EstadoJuegos')),
    before,
  );
  assert.deepEqual(api.post('state-load', {}), {
    ok: true,
    revision: 0,
    snapshot: null,
  });
});

test('state saves large emoji snapshots without oversized cells or formulas', () => {
  const api = setup();
  vm.runInContext('prepararEstadoJuegos()', api.context);
  const snapshot = JSON.stringify({
    version: 1,
    tables: {},
    note: 'Jess🏆😊=SUM(A1)'.repeat(8000),
  });
  assert.deepEqual(api.post('state-save', { revision: 0, snapshot }), {
    ok: true,
    saved: true,
    revision: 1,
  });
  const rows = api.sheets.get('EstadoJuegos').rows;
  assert.ok(rows.length > 5);
  assert.ok(rows.every((row) => String(row[2]).length < 50000));
  assert.deepEqual(api.post('state-load', {}), {
    ok: true,
    revision: 1,
    snapshot,
  });
  const smaller = JSON.stringify({ version: 1, tables: {}, note: 'short' });
  assert.equal(
    api.post('state-save', { revision: 1, snapshot: smaller }).saved,
    true,
  );
  assert.equal(api.post('state-load', {}).snapshot, smaller);
});

test('state rejects unsigned access, stale commits and corrupt data without resetting it', () => {
  const api = setup();
  vm.runInContext('prepararEstadoJuegos()', api.context);
  const snapshot = JSON.stringify({ version: 1, tables: {} });
  assert.equal(
    api.post(
      'state-save',
      { revision: 0, snapshot },
      { signature: '0'.repeat(64) },
    ).ok,
    false,
  );
  assert.equal(api.post('state-save', { revision: 0, snapshot }).saved, true);
  assert.deepEqual(api.post('state-save', { revision: 0, snapshot }), {
    ok: true,
    saved: false,
    revision: 1,
  });
  const rows = api.sheets.get('EstadoJuegos').rows;
  rows[2][2] = 'b64:YWJj';
  const corrupt = JSON.stringify(rows);
  assert.equal(api.post('state-load', {}).ok, false);
  assert.equal(api.post('state-save', { revision: 1, snapshot }).ok, false);
  assert.equal(JSON.stringify(rows), corrupt);
});

test('failed range writes preserve the previous state for a later retry', () => {
  const api = setup();
  vm.runInContext('prepararEstadoJuegos()', api.context);
  const snapshot = JSON.stringify({ version: 1, tables: {} });
  assert.equal(api.post('state-save', { revision: 0, snapshot }).saved, true);
  api.state.failAt = api.state.writes + 1;
  assert.equal(api.post('state-save', { revision: 1, snapshot }).ok, false);
  assert.equal(api.post('state-load', {}).revision, 1);
});
function game(participant, score, changes = {}) {
  return {
    id: randomUUID(),
    participant,
    game: 'memory_lif',
    score,
    started: Date.now() - 10000,
    achieved: Date.now() - 1000,
    version: 'test-v1',
    name: 'Prueba tecnica',
    email: 'test@example.test',
    phone: '88881111',
    nickname: 'Jess🏆',
    consent: true,
    updated: Date.now(),
    ...changes,
  };
}
function ranking(service, participant = null, changes = {}) {
  return service.post('ranking', {
    game: 'memory_lif',
    participant,
    limit: 10,
    start: Date.now() - 86400000,
    end: Date.now() + 86400000,
    ...changes,
  });
}
test('Signed legacy ranking stays compatible without mixing Memory scores into old games', () => {
  const service = setup(),
    participant = randomUUID();
  const records = [
    game(participant, 400, { game: 'catch' }),
    game(participant, 800, { game: 'snake' }),
    game(participant, 3000),
  ];
  assert.equal(service.post('sync', { kind: 'games', records }).ok, true);
  assert.equal(
    ranking(service, participant, { game: 'all', limit: 20 }).ranking.best,
    800,
  );
  assert.equal(ranking(service, participant).ranking.best, 3000);
  assert.equal(
    ranking(service, participant, { game: 'catch' }).ranking.best,
    400,
  );
  assert.equal(
    ranking(service, participant, { game: 'memory_lif', limit: 20 }).ok,
    false,
  );
});
test('Signed unified ranking filters rule versions, keeps one best across games and leaves history untouched', () => {
  const service = setup(),
    participant = randomUUID(),
    version = 'lif-games-20261007-unified-v2';
  const records = [
    game(participant, 2500, { version }),
    game(participant, 3000, { version, game: 'snake' }),
    game(participant, 999999, { game: 'snake' }),
    game(randomUUID(), 900000, { game: 'catch', version }),
  ];
  assert.equal(service.post('sync', { kind: 'games', records }).ok, true);
  const before = JSON.stringify(service.sheets.get('Juegos').rows);
  const rank = ranking(service, participant, {
    game: 'unified',
    version,
  }).ranking;
  assert.equal(rank.total, 1);
  assert.equal(rank.best, 3000);
  assert.equal(rank.position, 1);
  assert.equal(rank.top[0].game, 'snake');
  assert.equal(JSON.stringify(service.sheets.get('Juegos').rows), before);
  for (const row of service.sheets.get('Juegos').rows.slice(1))
    row[10] = String(row[10]).replace(/^'/, '');
  assert.deepEqual(
    ranking(service, participant, { game: 'unified', version }).ranking,
    rank,
  );
  assert.equal(ranking(service, participant, { game: 'unified' }).ok, false);
  assert.equal(
    ranking(service, participant, { game: 'unified', version: 'unrecognized' })
      .ok,
    false,
  );
  assert.equal(
    ranking(service, participant, { game: 'unified', version, limit: 21 }).ok,
    false,
  );
});
test('Signed current ranking returns twenty unique players from both games without rewriting history', () => {
  const service = setup(),
    version = 'lif-games-20261007-unified-v2';
  const records = Array.from({ length: 22 }, (_, i) =>
    game(randomUUID(), 3000 - i * 50, {
      version,
      nickname: `Player${i}`,
      game: i % 2 ? 'snake' : 'memory_lif',
    }),
  );
  records.push(
    game(records[0].participant, 100, {
      version,
      game: 'snake',
      nickname: records[0].nickname,
    }),
  );
  for (let start = 0; start < records.length; start += 20)
    assert.equal(
      service.post('sync', {
        kind: 'games',
        records: records.slice(start, start + 20),
      }).ok,
      true,
    );
  const before = JSON.stringify(service.sheets.get('Juegos').rows);
  const result = ranking(service, records[21].participant, {
    game: 'unified',
    version,
    limit: 20,
  });
  assert.equal(result.ok, true);
  assert.equal(result.ranking.top.length, 20);
  assert.equal(result.ranking.total, 22);
  assert.equal(result.ranking.position, 22);
  assert.equal(result.ranking.top[19].position, 20);
  assert.equal(new Set(result.ranking.top.map((row) => row.nickname)).size, 20);
  assert.deepEqual(
    new Set(result.ranking.top.map((row) => row.game)),
    new Set(['memory_lif', 'snake']),
  );
  assert.deepEqual(Object.keys(result.ranking.top[0]).sort(), [
    'game',
    'nickname',
    'position',
    'score',
  ]);
  assert.equal(JSON.stringify(service.sheets.get('Juegos').rows), before);
});
test('Setup adds only Juegos and Contactos, retains data and refuses mismatched headers', () => {
  const service = setup();
  assert.deepEqual([...service.sheets.keys()], ['Juegos', 'Contactos']);
  const headers = [...service.sheets.get('Juegos').rows[0]];
  vm.runInContext('prepararJuegosYContactos()', service.context);
  assert.deepEqual(service.sheets.get('Juegos').rows[0], headers);
  service.sheets.get('Juegos').rows[0][0] = 'changed';
  assert.throws(
    () => vm.runInContext('prepararJuegosYContactos()', service.context),
    /headers_changed/,
  );
});
test('Unsigned, tampered and expired requests cannot read or write records', () => {
  const service = setup();
  const opens = service.state.opens;
  for (const changes of [
    { signature: '0'.repeat(64) },
    { issuedAt: Date.now() - 600000 },
    { body: '{}' },
  ])
    assert.equal(
      service.post(
        'sync',
        { kind: 'games', records: [game(randomUUID(), 100)] },
        changes,
      ).ok,
      false,
    );
  assert.equal(service.state.opens, opens);
  assert.equal(service.sheets.get('Juegos').rows.length, 1);
});
test('Three improved scores are three rows, retries are one row, and ranking uses the best score', () => {
  const service = setup(),
    participant = randomUUID();
  const records = [
    game(participant, 100),
    game(participant, 200),
    game(participant, 300),
  ];
  assert.equal(service.post('sync', { kind: 'games', records }).ok, true);
  assert.equal(service.post('sync', { kind: 'games', records }).ok, true);
  assert.equal(service.sheets.get('Juegos').rows.length, 4);
  const result = ranking(service, participant);
  assert.equal(result.ranking.total, 1);
  assert.equal(result.ranking.best, 300);
  assert.equal(result.ranking.position, 1);
  assert.deepEqual(Object.keys(result.ranking.top[0]).sort(), [
    'game',
    'nickname',
    'position',
    'score',
  ]);
  assert.ok(!JSON.stringify(result).includes('example.test'));
  assert.equal(
    service.post('sync', {
      kind: 'games',
      records: records.map((row) => ({ ...row, nickname: 'Jess✨' })),
    }).ok,
    true,
  );
  assert.equal(ranking(service).ranking.top[0].nickname, 'Jess✨');
  assert.equal(service.sheets.get('Juegos').rows.length, 4);
});
test('Ranking honors dates, filters games and resolves ties without exposing private columns', () => {
  const service = setup(),
    first = randomUUID(),
    second = randomUUID();
  const records = [
    game(first, 500, { achieved: Date.now() - 3000 }),
    game(second, 500, {
      game: 'snake',
      achieved: Date.now() - 2000,
      nickname: 'Josh😊',
    }),
    game(randomUUID(), 999, { started: Date.now() - 172800000 }),
  ];
  service.post('sync', { kind: 'games', records });
  assert.equal(ranking(service).ranking.top[0].nickname, 'Jess🏆');
  assert.equal(ranking(service, null, { game: 'snake' }).ranking.total, 1);
  assert.equal(ranking(service, second).ranking.position, null);
  assert.equal(ranking(service, second, { game: 'snake' }).ranking.position, 1);
});
test('Contact records are literal, consented, separately stored and idempotent', () => {
  const service = setup();
  const record = {
    id: randomUUID(),
    name: '=formula',
    email: 'test@example.test',
    phone: '',
    message: '=IMPORTXML("test")',
    consent: true,
    created: Date.now(),
  };
  assert.equal(
    service.post('sync', { kind: 'contacts', records: [record] }).ok,
    true,
  );
  assert.equal(
    service.post('sync', { kind: 'contacts', records: [record] }).ok,
    true,
  );
  const rows = service.sheets.get('Contactos').rows;
  assert.equal(rows.length, 2);
  assert.equal(rows[1][2], "'=formula");
  assert.equal(rows[1][5], '\'=IMPORTXML("test")');
  assert.equal(
    service.post('sync', {
      kind: 'contacts',
      records: [{ ...record, consent: false }],
    }).ok,
    false,
  );
  assert.equal(service.sheets.get('Juegos').rows.length, 1);
});
test('Contact residence extends legacy headers without changing the old records or other tabs', () => {
  const service = setup(),
    contacts = service.sheets.get('Contactos'),
    games = JSON.stringify(service.sheets.get('Juegos').rows);
  contacts.rows[0] = contacts.rows[0].slice(0, 8);
  const old = [
    randomUUID(),
    new Date(),
    'Anterior',
    'old@example.test',
    '',
    'Mensaje anterior.',
    'Si',
    'lif-contacto',
  ];
  contacts.rows.push([...old]);
  const record = {
    id: randomUUID(),
    created: Date.now(),
    name: 'Prueba',
    email: 'qa@example.test',
    phone: '',
    message: 'Mensaje de prueba.',
    consent: true,
    province: 'San José',
    canton: 'Montes de Oca',
    district: 'San Pedro',
  };
  const result = service.post('sync', { kind: 'contacts', records: [record] });
  assert.equal(result.ok, true);
  assert.equal(result.contactLocationSaved, true);
  assert.deepEqual(contacts.rows[0].slice(8), [
    'Provincia',
    'Canton',
    'Distrito',
  ]);
  assert.deepEqual(contacts.rows[1], old);
  assert.deepEqual(contacts.rows[2].slice(8), [
    "'San José",
    "'Montes de Oca",
    "'San Pedro",
  ]);
  assert.equal(JSON.stringify(service.sheets.get('Juegos').rows), games);
  assert.equal(
    service.post('sync', { kind: 'contacts', records: [record] }).ok,
    true,
  );
  assert.equal(contacts.rows.length, 3);
  contacts.rows[0][8] = 'Otra columna del cliente';
  const before = JSON.stringify(contacts.rows);
  assert.equal(
    service.post('sync', {
      kind: 'contacts',
      records: [{ ...record, id: randomUUID() }],
    }).ok,
    false,
  );
  assert.equal(JSON.stringify(contacts.rows), before);
});
test('Legacy contacts still work and incomplete residence is rejected only when inconsistent', () => {
  const service = setup();
  const record = {
    id: randomUUID(),
    created: Date.now(),
    name: 'Prueba',
    email: 'qa@example.test',
    phone: '',
    message: 'Mensaje de prueba.',
    consent: true,
  };
  for (const location of [
    {},
    { province: '', canton: '', district: '' },
    { province: 'San José', canton: '', district: '' },
    { province: 'San José' },
    { province: 'San José', canton: 'Montes de Oca' },
  ])
    assert.equal(
      service.post('sync', {
        kind: 'contacts',
        records: [{ ...record, id: randomUUID(), ...location }],
      }).ok,
      true,
    );
  for (const location of [
    { canton: 'Montes de Oca' },
    { province: '', canton: 'Montes de Oca' },
    { province: 'San José', canton: '', district: 'San Pedro' },
    { district: 'San Pedro' },
    { province: 'Desconocida' },
    { province: 1 },
  ])
    assert.equal(
      service.post('sync', {
        kind: 'contacts',
        records: [{ ...record, id: randomUUID(), ...location }],
      }).ok,
      false,
    );
});
test('Partial write failures do not acknowledge, and retry completes without duplicating rows', () => {
  const service = setup();
  const records = [game(randomUUID(), 100), game(randomUUID(), 200)];
  service.state.failAt = 2;
  assert.equal(service.post('sync', { kind: 'games', records }).ok, false);
  service.state.failAt = 0;
  assert.equal(service.post('sync', { kind: 'games', records }).ok, true);
  assert.equal(service.sheets.get('Juegos').rows.length, 3);
});
