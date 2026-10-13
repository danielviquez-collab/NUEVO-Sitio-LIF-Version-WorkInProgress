export type HomeEntry = 'logo' | 'content';
export const HOME_NAVIGATION_KEY = 'lif-home-navigation';

type NavigationClick = {
  button: number;
  defaultPrevented: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: string;
};

export function homeNavigationRequest(mode: HomeEntry, click: NavigationClick, now = Date.now()) {
  if (click.button !== 0 || click.defaultPrevented || click.ctrlKey || click.metaKey
    || click.shiftKey || click.altKey || (click.target && click.target !== '_self')) return null;
  return JSON.stringify({ mode, at: now });
}

export function homeEntryFromStorage(raw: string | null, now: number, maxAge = 120000): HomeEntry {
  if (!raw) return 'logo';
  try {
    const entry = JSON.parse(raw);
    if ((entry.mode === 'content' || entry.mode === 'logo') && typeof entry.at === 'number'
      && now >= entry.at && now - entry.at <= maxAge) return entry.mode;
  } catch { /* Invalid or expired navigation falls back to the welcome. */ }
  return 'logo';
}

// Run before paint and hydration: fast native navigation must keep the same entrance choice.
export const homeNavigationBootstrap = `(()=>{
const key=${JSON.stringify(HOME_NAVIGATION_KEY)};
try{const raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);if(location.pathname==='/'){document.documentElement.dataset.homeEntry=(${homeEntryFromStorage.toString()})(raw,Date.now());}}catch{}
document.addEventListener('click',event=>{
const link=event.target instanceof Element?event.target.closest('a[data-home-entry]'):null;
if(!(link instanceof HTMLAnchorElement)||!['logo','content'].includes(link.dataset.homeEntry))return;
const request=(${homeNavigationRequest.toString()})(link.dataset.homeEntry,{button:event.button,defaultPrevented:event.defaultPrevented,ctrlKey:event.ctrlKey,metaKey:event.metaKey,shiftKey:event.shiftKey,altKey:event.altKey,target:link.target},Date.now());
if(request){try{sessionStorage.setItem(key,request);}catch{}}
});
})();`;
