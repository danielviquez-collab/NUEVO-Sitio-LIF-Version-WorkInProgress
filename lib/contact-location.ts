import catalog from './costa-rica-locations.json' with { type: 'json' };

export type LocationOption = { id: string; label: string };
export type ContactLocation = { province: string; canton: string; district: string };
export const emptyContactLocation: ContactLocation = { province: '', canton: '', district: '' };
export const provinces: LocationOption[] = catalog.provinces;
const provinceById = new Map(catalog.provinces.map(item => [item.id, item]));
const cantonById = new Map(catalog.cantons.map(item => [item.id, item]));
const districtById = new Map(catalog.districts.map(item => [item.id, item]));
const byName = (a: LocationOption, b: LocationOption) => a.label.localeCompare(b.label, 'es');

export function cantonsForProvince(province: string): LocationOption[] {
  return catalog.cantons.filter(item => item.province === province).sort(byName);
}

export function districtsForCanton(canton: string): LocationOption[] {
  return catalog.districts.filter(item => item.canton === canton).sort(byName);
}

export function validateContactLocation(data: Record<string, unknown>): ContactLocation {
  const code = (key: keyof ContactLocation) => {
    if (data[key] === undefined) return '';
    if (typeof data[key] !== 'string') throw new Error('INPUT_INVALID');
    return data[key].trim();
  };
  const province = code('province'), canton = code('canton'), district = code('district');
  if (province && !provinceById.has(province) ||
      canton && (!province || cantonById.get(canton)?.province !== province) ||
      district && (!canton || districtById.get(district)?.canton !== canton))
    throw new Error('INPUT_INVALID');
  return { province, canton, district };
}

export function contactLocationLabels(data: Record<string, unknown>): ContactLocation {
  const location = validateContactLocation(data);
  return {
    province: provinceById.get(location.province)?.label ?? '',
    canton: cantonById.get(location.canton)?.label ?? '',
    district: districtById.get(location.district)?.label ?? '',
  };
}
