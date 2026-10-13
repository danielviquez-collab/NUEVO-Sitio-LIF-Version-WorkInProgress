import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const service = 'https://services8.arcgis.com/ZBOPqyeRLt7yJb3h/arcgis/rest/services/DTA/FeatureServer';
async function query(layer, fields) {
  const url = new URL(`${service}/${layer}/query`);
  url.search = new URLSearchParams({
    f: 'json', where: '1=1', outFields: fields,
    returnGeometry: 'false', resultRecordCount: '2000',
  });
  const response = await fetch(url);
  assert.ok(response.ok);
  const data = await response.json();
  assert.ok(Array.isArray(data.features) && !data.error && !data.exceededTransferLimit);
  return data.features.map(feature => feature.attributes);
}

const provinces = new Map(), cantons = new Map(), districts = new Map();
const rows = await query(2, 'COD_DTA,PROVINCIA,CANTON,DISTRITO,COD_PROVIN,COD_CANTON');
function collect(map, value) {
  const previous = map.get(value.id);
  if (previous) assert.deepEqual(previous, value);
  else map.set(value.id, value);
}
for (const row of rows) {
  assert.match(row.COD_PROVIN, /^[1-7]$/);
  assert.match(row.COD_CANTON, /^[1-7]\d{2}$/);
  assert.match(row.COD_DTA, /^[1-7]\d{4}$/);
  assert.ok(row.COD_CANTON.startsWith(row.COD_PROVIN) && row.COD_DTA.startsWith(row.COD_CANTON));
  for (const name of [row.PROVINCIA, row.CANTON, row.DISTRITO]) assert.ok(typeof name === 'string' && name.trim());
  collect(provinces, { id: row.COD_PROVIN, label: row.PROVINCIA.trim() });
  collect(cantons, { id: row.COD_CANTON, label: row.CANTON.trim(), province: row.COD_PROVIN });
  collect(districts, { id: row.COD_DTA, label: row.DISTRITO.trim(), canton: row.COD_CANTON });
}
const officialProvinces = await query(0, 'PROVINCIA');
const officialCantons = await query(1, 'PROVINCIA,CANTON');
assert.equal(provinces.size, 7);
const byName = (a, b) => a.localeCompare(b, 'es');
assert.deepEqual([...provinces.values()].map(item => item.label).sort(byName), officialProvinces.map(row => row.PROVINCIA.trim()).sort(byName));
assert.deepEqual([...cantons.values()].map(item => `${provinces.get(item.province).label}|${item.label}`).sort(byName), officialCantons.map(row => `${row.PROVINCIA.trim()}|${row.CANTON.trim()}`).sort(byName));
assert.ok(districts.size >= 490);
const sorted = map => [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
const catalog = {
  source: 'Instituto Geografico Nacional / SNIT, Aplicativo DTA',
  sourceUrl: 'https://www.snitcr.go.cr/ico_herramientas',
  serviceUrl: service,
  retrievedOn: new Date().toISOString().slice(0, 10),
  provinces: sorted(provinces), cantons: sorted(cantons), districts: sorted(districts),
};
await writeFile(new URL('../lib/costa-rica-locations.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ provinces: provinces.size, cantons: cantons.size, districts: districts.size, source: catalog.sourceUrl }));
