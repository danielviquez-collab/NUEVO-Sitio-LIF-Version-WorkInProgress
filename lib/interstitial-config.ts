export type CampaignVideo = { id: string; name: string; src: string; weight: number; enabled: boolean };
export type InterstitialConfig = {
  enabled: boolean;
  campaignId: string;
  minBrowsingActiveTimeSeconds: number;
  maxBrowsingActiveTimeSeconds: number;
  preloadAfterBrowsingSeconds: number;
  gameExitGracePeriodSeconds: number;
  loadFailureTimeoutSeconds: number;
  skipAfterSeconds: number;
  videos: readonly CampaignVideo[];
};

export const INTERSTITIAL_CONFIG: InterstitialConfig = {
  enabled: true,
  campaignId: 'v1',
  minBrowsingActiveTimeSeconds: 60,
  maxBrowsingActiveTimeSeconds: 120,
  preloadAfterBrowsingSeconds: 40,
  gameExitGracePeriodSeconds: 15,
  loadFailureTimeoutSeconds: 8,
  skipAfterSeconds: 8,
  videos: [
    { id: 'gato', name: 'Gato', src: '/videos/interstitial/lif-interstitial-gato.mp4', weight: 1, enabled: true },
    { id: 'lego', name: 'Lego', src: '/videos/interstitial/lif-interstitial-lego.mp4', weight: 1, enabled: true },
    { id: 'plantas', name: 'Plantas', src: '/videos/interstitial/lif-interstitial-plantas.mp4', weight: 1, enabled: true },
  ],
};

export function localCampaignQA(development: boolean, hostname: string, search: string) {
  return development && ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    && new URLSearchParams(search).get('lifInterstitialQA') === '1';
}

export function campaignConfig(qa: boolean): InterstitialConfig {
  return qa ? { ...INTERSTITIAL_CONFIG, minBrowsingActiveTimeSeconds: 3, maxBrowsingActiveTimeSeconds: 5, preloadAfterBrowsingSeconds: 2 } : INTERSTITIAL_CONFIG;
}

// Ignore the old permanent campaign cap; QA and real sessions are independent.
export const campaignSessionKey = (id: string, qa: boolean) => `lif_interstitial_campaign_${id}_${qa ? 'qa_' : ''}session_v2`;
