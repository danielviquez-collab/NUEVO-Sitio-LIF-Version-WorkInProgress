'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Download, X } from 'lucide-react';
import Image from 'next/image';
import { recipes, recipeCategories, recipeMoments, type Recipe } from '@/lib/lif-content';
import { track } from '@/lib/analytics';
import { DocumentWhatsAppLink } from './document-whatsapp-link';

function RecipeDetail({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; };
  }, []);

  return (
      <dialog ref={dialogRef} className="detail-dialog recipe-dialog" aria-labelledby="recipe-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
        <button className="icon-button dialog-close" type="button" aria-label="Cerrar receta" onClick={onClose} autoFocus><X aria-hidden="true" /></button>
        <p className="eyebrow">{recipe.flavor} · {recipe.yield}</p>
        <h2 id="recipe-dialog-title">{recipe.title}</h2>
        {recipe.note && <p className="recipe-note">{recipe.note}</p>}
        <div className="recipe-method">
          <section>
            <h3>Lo que necesitás</h3>
            <ul>{recipe.ingredients.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h3>Preparación</h3>
            <ol>{recipe.preparation.map((item) => <li key={item}>{item}</li>)}</ol>
          </section>
        </div>
        <div className="recipe-download-row">
          <a className="action-button lif-highlight-action recipe-download" href={`/recipes/pdf/${recipe.slug}.pdf`} download={`LIF-${recipe.slug}.pdf`} onClick={() => track('recipe_download', { recipe: recipe.slug })}><Download aria-hidden="true" />Descargar receta <span>PDF</span></a>
          <DocumentWhatsAppLink href={`/recipes/pdf/${recipe.slug}.pdf`} title={recipe.title} kind="recipe" />
        </div>
      </dialog>
  );
}

export function RecipesBrowser() {
  const [category, setCategory] = useState('Todas');
  const [moment, setMoment] = useState('Todos los momentos');
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const filtered = useMemo(() => recipes.filter((recipe) =>
    (category === 'Todas' || recipe.category === category) &&
    (moment === 'Todos los momentos' || recipe.moments.includes(moment)),
  ), [category, moment]);

  return (
    <>
      <div className="recipe-filters" aria-label="Filtrar recetas">
        <label>Tipo de receta
          <select value={category} onChange={(event) => { setCategory(event.target.value); track('recipe_filter', { filter_type: 'category', filter_value: event.target.value }); }}>
            <option>Todas</option>
            {recipeCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Momento
          <select value={moment} onChange={(event) => { setMoment(event.target.value); track('recipe_filter', { filter_type: 'moment', filter_value: event.target.value }); }}>
            <option>Todos los momentos</option>
            {recipeMoments.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <output className="sr-only">{filtered.length} {filtered.length === 1 ? 'receta encontrada' : 'recetas encontradas'}</output>
      </div>
      {filtered.length ? (
        <div className="recipe-grid">
          {filtered.map((recipe, index) => (
            <article className={`recipe-tile recipe-tile-${index % 3}`} key={recipe.slug}>
              <button className="recipe-open" type="button" onClick={() => { setActiveRecipe(recipe); track('recipe_open', { recipe: recipe.title, source: 'recetario' }); }} aria-label={`Ver ${recipe.title}`}>
                <span className="recipe-image-wrap">
                  {recipe.image ? <Image src={recipe.image} alt={recipe.title} width={900} height={675} style={{ objectFit: recipe.imageFit ?? 'cover' }} unoptimized loading="lazy" /> : <span className="recipe-image-pending">{recipe.category}</span>}
                  <span className="recipe-arrow"><ArrowDown aria-hidden="true" /></span>
                </span>
                <span className="recipe-tile-copy">
                  <span className="eyebrow">{recipe.category} · {recipe.flavor}</span>
                  <strong>{recipe.title}</strong>
                  <span className="moment-tags">{recipe.moments.map((tag) => <span key={tag}>{tag}</span>)}</span>
                </span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-recipes">
          <p className="eyebrow">Todavía no hay una receta en este cruce</p>
          <p>Probá otra categoría o momento para seguir explorando.</p>
          <button className="text-button" type="button" onClick={() => { setCategory('Todas'); setMoment('Todos los momentos'); }}>Ver todas las recetas</button>
        </div>
      )}
      {activeRecipe && <RecipeDetail recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </>
  );
}
