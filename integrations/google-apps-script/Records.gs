// Additional private tabs. Confesiones and its Drive permissions remain unchanged.
const LIF_GAME_HEADERS = ['ID partida', 'Fecha de SCORE', 'ID participante', 'Nombre', 'Correo', 'Telefono', 'Nickname', 'Juego', 'SCORE', 'Inicio de partida', 'Version del juego', 'Autorizacion', 'Actualizacion del registro'];
const LIF_CONTACT_HEADERS = ['ID', 'Fecha de registro', 'Nombre', 'Correo', 'Telefono', 'Mensaje', 'Autorizacion', 'Origen', 'Provincia', 'Canton', 'Distrito'];

function prepararJuegosYContactos() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('busy');
  try {
    const book = SpreadsheetApp.openById(LIF_SHEET_ID);
    [['Juegos', LIF_GAME_HEADERS], ['Contactos', LIF_CONTACT_HEADERS]].forEach(function(entry) {
      let sheet = book.getSheetByName(entry[0]);
      if (!sheet) sheet = book.insertSheet(entry[0]);
      if (sheet.getLastRow() > 0) {
        if (entry[0] === 'Contactos') lifContactHeaders_(sheet);
        else lifRecordsHeaders_(sheet, entry[1]);
      }
      sheet.getRange(1, 1, 1, entry[1].length).setValues([entry[1]]).setBackground('#10381f').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, entry[1].length, 150);
      sheet.setColumnWidth(1, 290);
      if (entry[0] === 'Juegos') {
        sheet.setColumnWidth(3, 290);
        sheet.getRange('I:I').setNumberFormat('0');
        ['B:B', 'J:J', 'M:M'].forEach(function(range) { sheet.getRange(range).setNumberFormat('dd/MM/yyyy HH:mm:ss'); });
      } else {
        sheet.setColumnWidth(6, 420);
        sheet.getRange('F:F').setWrap(true);
        sheet.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm:ss');
      }
    });
    SpreadsheetApp.flush();
    console.log('Juegos y Contactos preparados. Confesiones no se modifico.');
  } finally { lock.releaseLock(); }
}

function lifRecordsHeaders_(sheet, headers) {
  if (!sheet || sheet.getRange(1, 1, 1, headers.length).getValues()[0].join('|') !== headers.join('|')) throw new Error('headers_changed');
}

function prepararUbicacionContactos() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('busy');
  try {
    lifContactHeaders_(SpreadsheetApp.openById(LIF_SHEET_ID).getSheetByName('Contactos'));
    SpreadsheetApp.flush();
    console.log('Provincia, canton y distrito preparados. Los registros anteriores se conservaron.');
  } finally { lock.releaseLock(); }
}

function lifContactHeaders_(sheet) {
  lifRecordsHeaders_(sheet, LIF_CONTACT_HEADERS.slice(0, 8));
  const range = sheet.getRange(1, 9, 1, 3), current = range.getValues()[0], extra = LIF_CONTACT_HEADERS.slice(8);
  if (extra.every(function(header, index) { return current[index] === header; })) return;
  if (extra.some(function(_, index) { return current[index] !== '' && current[index] !== undefined; })) throw new Error('headers_changed');
  // Append only the requested columns; previous records, columns and permissions stay intact.
  range.setValues([extra]).setBackground('#10381f').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setColumnWidths(9, 3, 160);
}

function lifRecordsAuth_(payload) {
  const key = PropertiesService.getScriptProperties().getProperty('LIF_SHEETS_SYNC_KEY');
  const maxBody = payload.action === 'state-save' ? 12001000 : 200000;
  if (!key || key.length < 32 || !['sync', 'ranking', 'state-load', 'state-save'].includes(payload.action) || !Number.isSafeInteger(payload.issuedAt) || Math.abs(Date.now() - payload.issuedAt) > 300000 || typeof payload.body !== 'string' || payload.body.length > maxBody || typeof payload.signature !== 'string' || !/^[a-f0-9]{64}$/.test(payload.signature)) throw new Error('unauthorized');
  const expected = Utilities.computeHmacSha256Signature(payload.action + '\n' + payload.issuedAt + '\n' + payload.body, key, Utilities.Charset.UTF_8).map(function(value) { return ('0' + (value & 255).toString(16)).slice(-2); }).join('');
  let mismatch = 0;
  for (let i = 0; i < 64; i++) mismatch |= expected.charCodeAt(i) ^ payload.signature.charCodeAt(i);
  if (mismatch) throw new Error('unauthorized');
  return JSON.parse(payload.body);
}

function lifRecordsRequest_(payload) {
  let lock;
  try {
    const data = lifRecordsAuth_(payload);
    const book = SpreadsheetApp.openById(LIF_SHEET_ID);
    if (payload.action === 'ranking') return lifJson_({ ok: true, ranking: lifRecordsRanking_(book, data) });
    if (payload.action === 'state-load' || payload.action === 'state-save') {
      lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) throw new Error('busy');
      return lifStateRequest_(book, payload.action, data);
    }
    if (!data || !['games', 'contacts'].includes(data.kind) || !Array.isArray(data.records) || !data.records.length || data.records.length > 20) throw new Error('invalid');
    // Validate the entire batch before writing its first row.
    const rows = data.records.map(function(record) { return lifRecordRow_(data.kind, record); });
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('busy');
    const sheet = book.getSheetByName(data.kind === 'games' ? 'Juegos' : 'Contactos');
    if (data.kind === 'contacts') lifContactHeaders_(sheet);
    else lifRecordsHeaders_(sheet, LIF_GAME_HEADERS);
    rows.forEach(function(row) {
      const existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(row[0]).matchEntireCell(true).useRegularExpression(false).findNext() : null;
      if (existing) {
        const range = sheet.getRange(existing.getRow(), 1, 1, row.length);
        if (data.kind !== 'games' || new Date(range.getValues()[0][12]).getTime() <= row[12].getTime()) range.setValues([row]);
      }
      else sheet.appendRow(row);
    });
    SpreadsheetApp.flush();
    return lifJson_({ ok: true, ids: rows.map(function(row) { return row[0]; }), contactLocationSaved: data.kind === 'contacts' });
  } catch (_) { return lifJson_({ ok: false, error: 'No se pudo confirmar el registro.' }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

function lifRecordRow_(kind, record) {
  const idPattern = /^[a-f0-9-]{36}$/;
  function text(key, min, max) {
    if (typeof record[key] !== 'string' || record[key].length < min || record[key].length > max) throw new Error('invalid');
    return lifCell_(record[key]);
  }
  function date(key) {
    if (!Number.isSafeInteger(record[key]) || record[key] < 1 || record[key] > Date.now() + 300000) throw new Error('invalid');
    return new Date(record[key]);
  }
  if (!record || !idPattern.test(record.id) || record.consent !== true || typeof record.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) throw new Error('invalid');
  const name = text('name', 2, 100), email = text('email', 3, 150), phone = text('phone', 0, 25);
  if (kind === 'contacts') {
    function optional(key) {
      return record[key] === undefined || record[key] === '' ? '' : text(key, 0, 100);
    }
    const province = optional('province'), canton = optional('canton'), district = optional('district');
    if ((province && !['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'].includes(record.province)) || (canton && !province) || (district && !canton)) throw new Error('invalid');
    return [record.id, date('created'), name, email, phone, text('message', 10, 3000), 'Si', 'lif-contacto', province, canton, district];
  }
  if (!idPattern.test(record.participant) || !['catch', 'memory_lif', 'snake'].includes(record.game) || !Number.isSafeInteger(record.score) || record.score < 0) throw new Error('invalid');
  // Preserve the historical label; never reclassify old records as Memory.
  const names = { catch: 'Atrapa el sabor', memory_lif: 'Memoria LIF', snake: 'Snake LIF' };
  return [record.id, date('achieved'), record.participant, name, email, phone, text('nickname', 2, 120), names[record.game], record.score, date('started'), text('version', 1, 100), 'Si', date('updated')];
}

function lifRecordsRanking_(book, data) {
  if (!data || !['all', 'unified', 'catch', 'memory_lif', 'snake'].includes(data.game) || !Number.isInteger(data.limit) || data.limit < 1 || data.limit > (data.game === 'memory_lif' && !data.version ? 10 : 20) || !Number.isSafeInteger(data.start) || !Number.isSafeInteger(data.end) || data.start >= data.end || (data.participant !== null && !/^[a-f0-9-]{36}$/.test(data.participant)) || (data.version !== undefined && data.version !== 'lif-games-20261007-unified-v2') || (data.game === 'unified' && data.version !== 'lif-games-20261007-unified-v2')) throw new Error('invalid');
  // Signed legacy clients retain their old ranking until the website is updated.
  // The active API requests unified results for the current rules, with a maximum of twenty.
  const sheet = book.getSheetByName('Juegos');
  lifRecordsHeaders_(sheet, LIF_GAME_HEADERS);
  const records = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, LIF_GAME_HEADERS.length).getValues() : [];
  const personal = {};
  records.forEach(function(row) {
    const started = new Date(row[9]).getTime(), achieved = new Date(row[1]).getTime();
    const game = row[7] === 'Snake LIF' ? 'snake' : row[7] === 'Memoria LIF' ? 'memory_lif' : row[7] === 'Atrapa el sabor' ? 'catch' : null;
    if (data.version && String(row[10]).replace(/^'/, '') !== data.version) return;
    if (data.game === 'unified' && !['memory_lif', 'snake'].includes(game)) return;
    if (data.game === 'all' && game === 'memory_lif') return;
    if (!game || !Number.isSafeInteger(row[8]) || row[8] < 0 || !Number.isFinite(achieved) || !Number.isFinite(started) || started < data.start || started > data.end || row[11] !== 'Si' || (!['all','unified'].includes(data.game) && game !== data.game)) return;
    const candidate = { id: row[0], participant: row[2], nickname: String(row[6]).replace(/^'/, ''), game: game, score: row[8], achieved: achieved };
    const previous = personal[candidate.participant];
    if (!previous || candidate.score > previous.score || (candidate.score === previous.score && (candidate.achieved < previous.achieved || (candidate.achieved === previous.achieved && candidate.id < previous.id)))) personal[candidate.participant] = candidate;
  });
  const rows = Object.keys(personal).map(function(key) { return personal[key]; }).sort(function(a, b) { return b.score - a.score || a.achieved - b.achieved || (a.participant < b.participant ? -1 : a.participant > b.participant ? 1 : 0); });
  const own = rows.findIndex(function(row) { return row.participant === data.participant; });
  return {
    top: rows.slice(0, data.limit).map(function(row, index) { return { position: index + 1, nickname: row.nickname, game: row.game, score: row.score }; }),
    position: own < 0 ? null : own + 1, best: own < 0 ? 0 : rows[own].score, total: rows.length
  };
}
