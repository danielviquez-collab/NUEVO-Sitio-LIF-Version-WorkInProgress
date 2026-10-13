// LIF: recepcion privada para revision. No publica historias ni videos.
const LIF_SHEET_ID = '1qVLcNX46tRT_qDnc2oTgzsX1d0n8SIkFvOS3Lv7nCog';
const LIF_HEADERS = ['ID', 'Fecha de registro', 'Alias', 'Confesion', 'Tipo de contenido', 'Nombre del video', 'Ver video en Drive', 'Descargar video', 'Autorizacion', 'Version de autorizacion', 'Estado', 'Origen'];
const LIF_MAX_VIDEO = 25 * 1024 * 1024;

function prepararConfesiones() {
  const book = SpreadsheetApp.openById(LIF_SHEET_ID);
  let sheet = book.getSheetByName('Confesiones');
  if (!sheet) {
    const first = book.getSheets()[0];
    sheet = first.getLastRow() === 0 ? first.setName('Confesiones') : book.insertSheet('Confesiones');
  }
  if (sheet.getLastRow() > 0 && sheet.getRange(1, 1, 1, LIF_HEADERS.length).getValues()[0].join('|') !== LIF_HEADERS.join('|')) throw new Error('Los encabezados existentes no coinciden. No se modificaron los datos.');
  sheet.getRange(1, 1, 1, LIF_HEADERS.length).setValues([LIF_HEADERS]).setBackground('#008c3c').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(4, 420);
  sheet.setColumnWidths(6, 3, 240);
  sheet.getRange('D:D').setWrap(true);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('LIF_FOLDER_ID')) {
    const folder = DriveApp.createFolder('LIF - Videos de confesiones (revision privada)');
    props.setProperty('LIF_FOLDER_ID', folder.getId());
  }
  SpreadsheetApp.flush();
  console.log('Encabezados y carpeta privada listos.');
}

function doGet() {
  return lifJson_({ ok: true, service: 'LIF confesiones', version: 1 });
}

function doPost(event) {
  let lock;
  let uploaded;
  let rowWritten = false;
  try {
    const raw = event && event.postData && event.postData.contents;
    if (typeof raw !== 'string' || raw.length > Math.ceil(LIF_MAX_VIDEO * 4 / 3) + 50000) throw new Error('invalid');
    const payload = JSON.parse(raw);
    if (payload && payload.source === 'lif-client-tests') return lifRecordsRequest_(payload);
    const data = lifValidate_(payload);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('busy');
    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(LIF_SHEET_ID).getSheetByName('Confesiones');
    if (!sheet || !props.getProperty('LIF_FOLDER_ID')) throw new Error('not_configured');
    if (sheet.getRange(1, 1, 1, LIF_HEADERS.length).getValues()[0].join('|') !== LIF_HEADERS.join('|')) throw new Error('headers_changed');
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).useRegularExpression(false).findNext()) return lifJson_({ ok: true, id: data.id });
    const now = new Date();
    const day = Utilities.formatDate(now, 'America/Costa_Rica', 'yyyy-MM-dd');
    const minute = Math.floor(now.getTime() / 60000);
    const saved = JSON.parse(props.getProperty('LIF_USAGE') || '{}');
    const usage = { day: day, count: saved.day === day ? saved.count || 0 : 0, bytes: saved.day === day ? saved.bytes || 0 : 0, minute: minute, burst: saved.minute === minute ? saved.burst || 0 : 0 };
    if (usage.count >= 100 || usage.burst >= 10 || usage.bytes + data.bytes.length > 250 * 1024 * 1024) throw new Error('limit');
    let viewUrl = '', downloadUrl = '';
    if (data.video) {
      const folder = DriveApp.getFolderById(props.getProperty('LIF_FOLDER_ID'));
      // Reuse a file left by an interrupted request; ids remain stable on retry.
      const filename = 'LIF-' + data.id + '.' + data.extension;
      const previous = folder.getFilesByName(filename);
      uploaded = previous.hasNext() ? previous.next() : folder.createFile(Utilities.newBlob(data.bytes, data.video.type, filename));
      viewUrl = uploaded.getUrl();
      downloadUrl = uploaded.getDownloadUrl();
    }
    sheet.appendRow([data.id, now, lifCell_(data.alias), lifCell_(data.confession), data.video ? (data.confession ? 'Texto y video' : 'Video') : 'Texto', lifCell_(data.video ? data.video.name : ''), viewUrl, downloadUrl, 'Si', '2026-09', 'Pendiente de revision', 'lif-confesiones']);
    rowWritten = true;
    SpreadsheetApp.flush();
    usage.count++; usage.burst++; usage.bytes += data.bytes.length;
    props.setProperty('LIF_USAGE', JSON.stringify(usage));
    return lifJson_({ ok: true, id: data.id });
  } catch (_) {
    if (uploaded && !rowWritten) { try { uploaded.setTrashed(true); } catch (_) { /* No personal data in logs. */ } }
    return lifJson_({ ok: false, error: 'No se pudo confirmar el envio. Conserva el contenido e intenta de nuevo.' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function lifValidate_(payload) {
  if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(payload.id) || payload.consent !== true || payload.consentVersion !== '2026-09' || payload.source !== 'lif-confesiones' || payload.website) throw new Error('invalid');
  if (typeof payload.confession !== 'string' || typeof payload.alias !== 'string') throw new Error('invalid');
  const confession = payload.confession.trim(), alias = payload.alias.trim();
  if (confession.length > 5000 || alias.length > 32) throw new Error('invalid');
  const video = payload.video;
  let bytes = [], extension = '';
  if (video) {
    if (typeof video.name !== 'string' || video.name.length > 255 || !/\.(mp4|mov|webm)$/i.test(video.name) || ['video/mp4', 'video/quicktime', 'video/webm'].indexOf(video.type) < 0 || !Number.isInteger(video.size) || video.size < 12 || video.size > LIF_MAX_VIDEO || typeof video.base64 !== 'string' || video.base64.length !== 4 * Math.ceil(video.size / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(video.base64)) throw new Error('invalid_video');
    bytes = Utilities.base64Decode(video.base64);
    if (bytes.length !== video.size) throw new Error('invalid_video');
    const webm = [0x1a, 0x45, 0xdf, 0xa3].every(function(value, index) { return (bytes[index] & 255) === value; });
    const mp4 = String.fromCharCode.apply(null, bytes.slice(4, 8)) === 'ftyp';
    if (video.type === 'video/webm' ? !webm : !mp4) throw new Error('invalid_video');
    extension = video.type === 'video/webm' ? 'webm' : video.type === 'video/quicktime' ? 'mov' : 'mp4';
  }
  if (!confession && !video) throw new Error('empty');
  return { id: payload.id, confession: confession, alias: alias, video: video, bytes: bytes, extension: extension };
}

function lifCell_(text) { return text ? "'" + text : ''; }
function lifJson_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
