'use client';

import { useRef, useState } from 'react';
import { ArrowDownToLine, RotateCcw, Smartphone } from 'lucide-react';

export function MenuPreviewWorkbench() {
  const [width, setWidth] = useState(390);
  const frame = useRef<HTMLIFrameElement>(null);
  return (
    <main className="menu-preview-workbench">
      <div className="menu-preview-toolbar">
        <h1>Menú móvil</h1>
        <label className="menu-preview-size">
          <Smartphone aria-hidden="true" />
          <select aria-label="Ancho de pantalla" value={width} onChange={(event) => setWidth(Number(event.target.value))}>
            <option value={320}>320 px</option>
            <option value={390}>390 px</option>
            <option value={430}>430 px</option>
          </select>
        </label>
        <button type="button" title="Ir al footer" aria-label="Ir al footer" onClick={() => frame.current?.contentDocument?.querySelector('.site-footer')?.scrollIntoView({ behavior: 'smooth' })}>
          <ArrowDownToLine aria-hidden="true" />
        </button>
        <button type="button" title="Reiniciar ejemplo" aria-label="Reiniciar ejemplo" onClick={() => frame.current?.contentWindow?.location.reload()}>
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
      <iframe ref={frame} className="menu-preview-phone" style={{ width }} src="/pruebas/menu/movil" title="Propuesta de menú móvil LIF" />
    </main>
  );
}
