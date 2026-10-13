import { Group, PerspectiveCamera, Scene } from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import type { Flavor } from './lif-content';
import { centeredPackBounds, easeInOut, easeOut, mix, printedPanelBounds, type PackBounds, type SachetPhase } from './sachet-motion';

export function createSachetScene(host: HTMLElement, frontImage: HTMLImageElement, backImage: HTMLImageElement | null,
  back: NonNullable<Flavor['back']>, source: PackBounds, panel: HTMLElement) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 1, 4000);
  const renderer = new CSS3DRenderer();
  camera.position.z = 1000;
  host.appendChild(renderer.domElement);
  const pack = new Group();
  scene.add(pack);
  const front = new CSS3DObject(document.createElement('div'));
  front.element.className = 'sachet-face sachet-front';
  const image = frontImage.cloneNode() as HTMLImageElement;
  image.removeAttribute('id'); image.alt = ''; image.loading = 'eager';
  image.style.visibility = 'visible';
  front.element.appendChild(image);
  front.position.z = .4;
  const reverse = new CSS3DObject(document.createElement('div'));
  reverse.element.className = 'sachet-face sachet-back';
  reverse.element.dataset.artwork = back.kind;
  if (back.medium) reverse.element.dataset.medium = back.medium;
  reverse.element.style.setProperty('--sachet-ink', back.color);
  if (!backImage) Object.assign(reverse.element.style, {
      maskImage: `url("${frontImage.currentSrc || frontImage.src}")`,
      maskSize: '100% 100%', maskRepeat: 'no-repeat',
    });
  if (backImage) {
    const rear = backImage.cloneNode() as HTMLImageElement;
    rear.alt = ''; rear.loading = 'eager'; reverse.element.appendChild(rear);
  } else {
    for (const name of ['film', 'seam', 'seal-top', 'seal-bottom']) {
      const part = document.createElement('div');
      part.className = `sachet-${name}`;
      reverse.element.appendChild(part);
    }
  }
  reverse.rotation.y = Math.PI;
  reverse.position.z = -.4;
  pack.add(front, reverse);

  // The printed surface is also the expanding surface: no second card appears mid-flight.
  const print = panel.cloneNode(true) as HTMLElement;
  print.className = 'sachet-print';
  print.removeAttribute('aria-hidden');
  print.inert = true;
  for (const element of print.querySelectorAll('[id]')) element.removeAttribute('id');
  for (const element of print.querySelectorAll('[aria-labelledby]')) element.removeAttribute('aria-labelledby');
  const label = new CSS3DObject(print);
  label.position.z = .1;
  reverse.add(label);
  const printedCard = print.querySelector<HTMLElement>('.nutrition-dialog')!;
  const originalCard = panel.querySelector<HTMLElement>('.nutrition-dialog')!;
  const close = print.querySelector<HTMLElement>('.dialog-close')!;
  const cardStyle = getComputedStyle(originalCard);
  const shadow = cardStyle.boxShadow;
  const border = cardStyle.borderColor;
  const radius = cardStyle.borderRadius;
  let viewport: PackBounds = { left: 0, top: 0, width: 1, height: 1 };
  let panelBounds: PackBounds = { left: 0, top: 0, width: 1, height: 1 };
  let phase: SachetPhase = 'focusing';
  let progress = 0;
  let detached = false;

  for (const face of [front, reverse]) Object.assign(face.element.style, { width: `${source.width}px`, height: `${source.height}px` });

  function resize(next: PackBounds) {
    viewport = next;
    renderer.setSize(next.width, next.height);
    camera.aspect = next.width / next.height;
    camera.fov = 2 * Math.atan(next.height / 2000) * 180 / Math.PI;
    camera.updateProjectionMatrix();
    const bounds = panel.getBoundingClientRect();
    panelBounds = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    print.style.width = `${bounds.width}px`;
    print.style.height = `${bounds.height}px`;
    render(phase, progress);
  }

  function render(nextPhase: SachetPhase, t: number) {
    phase = nextPhase; progress = t;
    // The supplied nutrition label remains untouched until its expansion starts.
    print.style.visibility = backImage && phase !== 'nutritionExpanding' ? 'hidden' : 'visible';
    const target = centeredPackBounds(source, viewport);
    const focusing = phase === 'focusing' ? easeOut(t) : 1;
    const centerX = mix(source.left + source.width / 2, target.left + target.width / 2, focusing);
    const centerY = mix(source.top + source.height / 2, target.top + target.height / 2, focusing);
    const scale = mix(1, target.width / source.width, focusing);
    const lift = phase === 'focusing' ? Math.sin(Math.PI * t) * 45 : 0;
    pack.position.set(centerX - viewport.left - viewport.width / 2, viewport.height / 2 - centerY + viewport.top, lift);
    pack.scale.setScalar(scale * (1 - lift / camera.position.z));
    pack.rotation.set(0, 0, 0);
    if (phase === 'settling') {
      const rock = Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI);
      pack.rotation.z = rock * .035;
      pack.rotation.x = Math.sin(t * Math.PI) * .03;
      pack.position.x += rock * 2;
      pack.position.y -= Math.sin(t * Math.PI) * 2;
    }
    if (phase === 'turning') pack.rotation.y = Math.PI * easeInOut(t);
    if (phase === 'backVisible' || phase === 'nutritionExpanding') pack.rotation.y = Math.PI;

    const localPrint = printedPanelBounds({ left: 0, top: 0, width: source.width, height: source.height }, panelBounds, back.nutritionArea);
    if (!detached) {
      label.position.set(localPrint.left + localPrint.width / 2 - source.width / 2,
        source.height / 2 - localPrint.top - localPrint.height / 2, .1);
      label.scale.setScalar(localPrint.scale);
    }
    if (phase === 'nutritionExpanding') {
      if (!detached) { scene.attach(label); detached = true; }
      const printed = printedPanelBounds(target, panelBounds, back.nutritionArea);
      const p = easeInOut(t);
      const retreat = .5 * scale * p;
      // Both surfaces retreat together so the fading reverse never crosses the printed label.
      pack.position.z = -retreat;
      const z = .5 * scale - retreat;
      // CSS perspective at the final frame is exactly 1 CSS pixel per world unit.
      const x = mix(printed.left + printed.width / 2, panelBounds.left + panelBounds.width / 2, p);
      const y = mix(printed.top + printed.height / 2, panelBounds.top + panelBounds.height / 2, p);
      label.rotation.set(0, 0, 0);
      label.position.set(x - viewport.left - viewport.width / 2, viewport.height / 2 - y + viewport.top, z);
      label.scale.setScalar(mix(printed.scale, 1, p));
      for (const face of [front, reverse]) face.element.style.opacity = String(1 - easeInOut(Math.min(1, t / .7)));
      printedCard.style.boxShadow = t > .45 ? shadow : 'none';
      printedCard.style.borderColor = t > .45 ? border : 'transparent';
      printedCard.style.borderRadius = t > .45 ? radius : '0';
      close.style.opacity = String(Math.max(0, (t - .6) / .4));
    } else {
      printedCard.style.boxShadow = 'none';
      printedCard.style.borderColor = 'transparent';
      printedCard.style.borderRadius = '0';
      close.style.opacity = '0';
    }
    renderer.render(scene, camera);
  }

  return { render, resize, dispose() { renderer.domElement.remove(); scene.clear(); } };
}
