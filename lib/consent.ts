export type ConsentChoice = { necessary: true; analytics: boolean; marketing: boolean; savedAt: number; version: 1 };
export const CONSENT_KEY = 'lif-cookie-preferences-v1';
const EXPIRY = 180 * 24 * 60 * 60 * 1000;
let sessionChoice: ConsentChoice | null = null;
let storageUnavailable = false;

export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  if (storageUnavailable) return sessionChoice;
  let raw: string | null;
  try { raw = window.localStorage.getItem(CONSENT_KEY); } catch { return sessionChoice; }
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (value?.version !== 1 || value.necessary !== true || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || typeof value.savedAt !== 'number' || value.savedAt > Date.now() || Date.now() - value.savedAt > EXPIRY) return null;
    return value;
  } catch { return null; }
}

export function applyConsent(choice: ConsentChoice | null, command: 'default' | 'update' = 'update') {
  if (typeof window === 'undefined') return;
  const options = {
    analytics_storage: choice?.analytics ? 'granted' : 'denied',
    ad_storage: choice?.marketing ? 'granted' : 'denied',
    ad_user_data: choice?.marketing ? 'granted' : 'denied',
    ad_personalization: choice?.marketing ? 'granted' : 'denied',
    security_storage: 'granted',
  };
  window.dataLayer = window.dataLayer || [];
  function consentCommand(..._args: unknown[]) { window.dataLayer?.push(arguments); }
  consentCommand('consent', command, options);
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  const choice: ConsentChoice = { necessary: true, analytics, marketing, savedAt: Date.now(), version: 1 };
  sessionChoice = choice;
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice)); storageUnavailable = false; } catch { storageUnavailable = true; }
  applyConsent(choice);
  window.dispatchEvent(new CustomEvent('lif:consent-changed', { detail: choice }));
  return choice;
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event('lif:open-cookie-preferences'));
}
