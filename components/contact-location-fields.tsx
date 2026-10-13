'use client';

import { useId, type RefObject } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  cantonsForProvince, districtsForCanton, provinces,
  type ContactLocation, type LocationOption,
} from '@/lib/contact-location';

function LocationPicker({ label, options, value, onChange, disabled, placeholder, portalRef }: {
  label: string;
  options: LocationOption[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
  placeholder: string;
  portalRef: RefObject<HTMLDialogElement | null>;
}) {
  const id = useId();
  return (
    <div className="contact-location-field">
      <label htmlFor={id}>{label}</label>
      <Combobox.Root
        items={options}
        value={options.find(item => item.id === value) ?? null}
        onValueChange={(item: LocationOption | null) => onChange(item?.id ?? '')}
        itemToStringLabel={(item: LocationOption) => item.label}
        disabled={disabled}
      >
        <div className="contact-location-control" data-disabled={disabled || undefined}>
          <Combobox.Input id={id} className="contact-location-input" placeholder={placeholder} autoComplete="off" />
          {value && <Combobox.Clear className="contact-location-icon" aria-label={`Quitar ${label.toLowerCase()}`} title={`Quitar ${label.toLowerCase()}`}><X aria-hidden="true" /></Combobox.Clear>}
          <Combobox.Trigger className="contact-location-icon" aria-label={`Mostrar ${label.toLowerCase()}`} title={`Mostrar ${label.toLowerCase()}`}><ChevronDown aria-hidden="true" /></Combobox.Trigger>
        </div>
        <Combobox.Portal container={portalRef}>
          <Combobox.Positioner className="contact-location-positioner" sideOffset={4} positionMethod="fixed">
            <Combobox.Popup className="contact-location-popup">
              <Combobox.Empty className="contact-location-empty">Sin coincidencias.</Combobox.Empty>
              <Combobox.List className="contact-location-list">
                {(item: LocationOption) => (
                  <Combobox.Item className="contact-location-option" key={item.id} value={item}>
                    <span>{item.label}</span>
                    <Combobox.ItemIndicator><Check aria-hidden="true" /></Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

export function ContactLocationFields({ value, onChange, busy, portalRef }: {
  value: ContactLocation;
  onChange: (value: ContactLocation) => void;
  busy: boolean;
  portalRef: RefObject<HTMLDialogElement | null>;
}) {
  const id = useId();
  return (
    <fieldset className="contact-location" disabled={busy}>
      <legend>Lugar de residencia <span>(opcional)</span></legend>
      <div className="contact-location-grid">
        <div className="contact-location-field">
          <label htmlFor={id}>Provincia</label>
          <div className="contact-location-province">
            <select id={id} value={value.province} disabled={busy} onChange={event => onChange({ province: event.target.value, canton: '', district: '' })}>
              <option value="">Elegí provincia</option>
              {provinces.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <span className="contact-location-select-icon" aria-hidden="true"><ChevronDown /></span>
          </div>
        </div>
        <LocationPicker key={`canton-${value.province}`} label="Cantón" options={cantonsForProvince(value.province)} value={value.canton} onChange={canton => onChange({ ...value, canton, district: '' })} disabled={busy || !value.province} placeholder={value.province ? 'Elegí cantón' : 'Primero elegí provincia'} portalRef={portalRef} />
        <LocationPicker key={`district-${value.canton}`} label="Distrito" options={districtsForCanton(value.canton)} value={value.district} onChange={district => onChange({ ...value, district })} disabled={busy || !value.canton} placeholder={value.canton ? 'Elegí distrito' : 'Primero elegí cantón'} portalRef={portalRef} />
      </div>
    </fieldset>
  );
}
