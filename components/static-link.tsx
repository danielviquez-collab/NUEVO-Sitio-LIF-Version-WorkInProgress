import type { AnchorHTMLAttributes } from 'react';

// Exported pages navigate as documents; interactive controls hydrate on each page.
export default function StaticLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const normalized = href?.startsWith('/') ? href.replace(/\/(?=[?#]|$)/, '') || '/' : href;
  return <a {...props} href={normalized} />;
}
