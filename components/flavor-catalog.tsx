'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { FlavorPack } from './flavor-pack';
import { NutritionLink } from './nutrition-link';
import { captureSachet, preloadSachetScene, SachetSelection, useSachetClose, type SachetSource } from './sachet-selection';
import { flavors, type Flavor } from '@/lib/lif-content';
import { nutritionFacts } from '@/lib/nutrition';
import { track } from '@/lib/analytics';

const collection = [...flavors.filter((flavor) => flavor.isNew), ...flavors.filter((flavor) => !flavor.isNew)];

function NutritionDetail({ flavor }: { flavor: Flavor }) {
  const onClose = useSachetClose();
  const facts = nutritionFacts[flavor.slug];

  return (
    <div className="detail-dialog nutrition-dialog">
      <button className="icon-button dialog-close" type="button" aria-label="Cerrar información nutricional" onClick={onClose}><X aria-hidden="true" /></button>
      <p className="nutrition-label-title">Información nutricional</p>
      <h2 id="nutrition-title">{flavor.name}</h2>
      {facts ? <>
        <p className="nutrition-serving"><strong>Tamaño de porción:</strong> 6,25 g (equivale a un vaso de 250 mL de bebida preparada).<br /><strong>Porciones por empaque:</strong> 4.</p>
        <table className="nutrition-table">
          <caption>Cantidades por porción:</caption>
          <thead><tr><th scope="col">Nutriente</th><th scope="col">Cant. por porción</th><th scope="col">%VRN*</th></tr></thead>
          <tbody>
            <tr className="nutrition-energy"><th scope="row">Energía</th><td>{facts.energy}</td><td aria-label="No indicado" /></tr>
            <tr><th scope="row">Energía de la grasa</th><td>0 kJ (0 kcal)</td><td aria-label="No indicado" /></tr>
            {facts.rows.map((row) => <tr className={['Grasa saturada', 'Grasa trans', 'Azúcar'].includes(row.label) ? 'nutrition-subrow' : undefined} key={row.label}><th scope="row">{row.label}</th><td>{row.amount}</td><td>{row.reference ?? ''}</td></tr>)}
          </tbody>
        </table>
        <p className="nutrition-footnote">*El porcentaje de valor de referencia del nutriente (VRN) está basado en una dieta de 8400 kJ (2000 kcal), según recomendaciones de FAO/OMS. **Porcentaje del valor de referencia del nutriente tomado de FDA, Labelling &amp; Nutrition, apéndice F, {facts.referenceYear}.</p>
        <NutritionLink href={`/nutrition/${flavor.slug}.pdf`} flavor={flavor.name} share />
      </> : <p className="nutrition-pending">La ficha nutricional de este sabor estará disponible próximamente.</p>}
    </div>
  );
}

export function FlavorCatalog() {
  const [selection, setSelection] = useState<{ flavor: Flavor; source: SachetSource | null } | null>(null);
  const busy = useRef(false);
  const closeFlavor = useCallback(() => { setSelection(null); busy.current = false; }, []);
  useEffect(() => { void preloadSachetScene().catch(() => {}); }, []);

  function openFlavor(flavor: Flavor, button: HTMLButtonElement) {
    if (busy.current) return;
    busy.current = true;
    setSelection({ flavor, source: captureSachet(button) });
    track('nutrition_open', { flavor: flavor.name, source: 'packshot' });
  }

  return <>
    <div className="catalog-heading"><p className="eyebrow">Todos los sabores</p><span>{collection.length} Sabores</span></div>
    <div className="catalog-grid">
      {collection.map((flavor) => <article className={`catalog-item${flavor.isNew ? ' catalog-item-new' : ''}`} key={flavor.slug}>
        <button className="catalog-pack-button" type="button" aria-label={`Ver información nutricional de ${flavor.name}`} aria-busy={selection?.flavor.slug === flavor.slug} onClick={(event) => openFlavor(flavor, event.currentTarget)}>
          <FlavorPack flavor={flavor} />
        </button>
        <div className="catalog-item-copy">
          <span className="eyebrow">{flavor.isNew ? 'Recién llegado' : 'LIF'}</span>
          <h2>{flavor.name}</h2>
          {flavor.nutrition && nutritionFacts[flavor.slug] ? <NutritionLink href={`/nutrition/${flavor.slug}.pdf`} flavor={flavor.name} /> : <p className="pending-data">Ficha nutricional próximamente</p>}
        </div>
      </article>)}
    </div>
    {selection && <SachetSelection key={selection.flavor.slug} source={selection.source} flavor={selection.flavor} onClose={closeFlavor}>
      <NutritionDetail flavor={selection.flavor} />
    </SachetSelection>}
  </>;
}
