export function normalizeNetlifyHead(head: HTMLHeadElement) {
  for (const node of head.childNodes) {
    if (node.nodeType !== 8 || !node.textContent?.trimStart().startsWith('This site is hosted on Netlify.')) continue;
    const previous = node.previousSibling;
    // Netlify's leading whitespace makes React mistake hoisted metadata for application content.
    if (previous?.nodeType === 3 && !previous.textContent?.trim()) previous.remove();
  }
}

export const hostingMarkupBootstrap = `(${normalizeNetlifyHead.toString()})(document.head);`;
