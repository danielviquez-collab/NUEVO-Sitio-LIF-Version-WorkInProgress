import { readConsent } from './consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: string, detail: Record<string, string> = {}) {
  if (typeof window === 'undefined' || !readConsent()?.analytics) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...detail });
}
