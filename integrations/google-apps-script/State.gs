// Private server state for low-traffic client tests. Never exposed by the public ranking.
const LIF_STATE_HEADERS = ['Revision', 'Parte', 'Contenido'];
const LIF_STATE_MAX = 6000000;

function prepararEstadoJuegos() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('busy');
  try {
    const book = SpreadsheetApp.openById(LIF_SHEET_ID);
    let sheet = book.getSheetByName('EstadoJuegos');
    if (!sheet) sheet = book.insertSheet('EstadoJuegos');
    if (sheet.getLastRow()) lifRecordsHeaders_(sheet, LIF_STATE_HEADERS);
    else sheet.getRange(1, 1, 1, 3).setValues([LIF_STATE_HEADERS]);
    sheet.hideSheet();
    SpreadsheetApp.flush();
    console.log('EstadoJuegos preparado y oculto. Las otras hojas no se modificaron.');
  } finally { lock.releaseLock(); }
}

function lifStateDigest_(snapshot) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, snapshot, Utilities.Charset.UTF_8)
    .map(function(value) { return ('0' + (value & 255).toString(16)).slice(-2); }).join('');
}

function lifStateRead_(sheet) {
  lifRecordsHeaders_(sheet, LIF_STATE_HEADERS);
  if (sheet.getLastRow() === 1) return { revision: 0, snapshot: null };
  const head = sheet.getRange(2, 1, 1, 3).getValues()[0];
  const meta = JSON.parse(head[2]);
  if (!Number.isSafeInteger(head[0]) || head[0] < 1 || head[1] !== 0 || !Number.isInteger(meta.parts) || meta.parts < 1 || meta.parts > 2048 || !Number.isInteger(meta.chars) || meta.chars < 1 || meta.chars > LIF_STATE_MAX || !/^[a-f0-9]{64}$/.test(meta.sha256) || sheet.getLastRow() < meta.parts + 2) throw new Error('state_corrupt');
  const rows = sheet.getRange(3, 1, meta.parts, 3).getValues();
  const encoded = rows.map(function(row, index) {
    if (row[0] !== head[0] || row[1] !== index + 1 || typeof row[2] !== 'string' || !/^b64:[A-Za-z0-9+/=]+$/.test(row[2])) throw new Error('state_corrupt');
    return row[2].slice(4);
  }).join('');
  const snapshot = Utilities.newBlob(Utilities.base64Decode(encoded)).getDataAsString('UTF-8');
  if (snapshot.length !== meta.chars || lifStateDigest_(snapshot) !== meta.sha256) throw new Error('state_corrupt');
  return { revision: head[0], snapshot: snapshot };
}

function lifStateRequest_(book, action, data) {
  const sheet = book.getSheetByName('EstadoJuegos');
  const current = lifStateRead_(sheet);
  if (action === 'state-load') return lifJson_({ ok: true, revision: current.revision, snapshot: current.snapshot });
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0 || typeof data.snapshot !== 'string' || !data.snapshot.length || data.snapshot.length > LIF_STATE_MAX) throw new Error('invalid');
  if (data.revision !== current.revision) return lifJson_({ ok: true, saved: false, revision: current.revision });
  const parsed = JSON.parse(data.snapshot);
  if (!parsed || parsed.version !== 1 || !parsed.tables) throw new Error('invalid');
  const revision = current.revision + 1;
  // Base64 keeps every cell below its size limit and prevents formulas in arbitrary JSON chunks.
  const encoded = Utilities.base64Encode(data.snapshot, Utilities.Charset.UTF_8);
  const parts = encoded.match(/.{1,30000}/g);
  const meta = { parts: parts.length, chars: data.snapshot.length, sha256: lifStateDigest_(data.snapshot) };
  const rows = [[revision, 0, JSON.stringify(meta)]].concat(parts.map(function(part, index) { return [revision, index + 1, 'b64:' + part]; }));
  // One range write under the script lock; trailing rows from older revisions are ignored.
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  SpreadsheetApp.flush();
  return lifJson_({ ok: true, saved: true, revision: revision });
}
