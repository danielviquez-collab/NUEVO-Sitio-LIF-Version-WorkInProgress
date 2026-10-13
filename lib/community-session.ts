export const COMMUNITY_SESSION_KEY = 'lif_community_order_v1';
export type CommunityOrder = { videos: string[]; stories: string[] };
type SessionStorage = Pick<Storage, 'getItem' | 'setItem'>;

function shuffle(ids: readonly string[], random: () => number) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function matchesCatalog(value: unknown, ids: readonly string[]): value is string[] {
  return Array.isArray(value) && value.length === ids.length && new Set(value).size === ids.length
    && value.every((id) => typeof id === 'string' && ids.includes(id));
}

export function communityOrder(videos: readonly string[], stories: readonly string[], storage?: SessionStorage, random = Math.random): CommunityOrder {
  try {
    const saved: unknown = JSON.parse(storage?.getItem(COMMUNITY_SESSION_KEY) ?? 'null');
    if (saved && typeof saved === 'object' && 'videos' in saved && 'stories' in saved
      && matchesCatalog(saved.videos, videos) && matchesCatalog(saved.stories, stories)) {
      return { videos: saved.videos, stories: saved.stories };
    }
  } catch { /* An unavailable or outdated session must not hide the catalog. */ }
  const order = { videos: shuffle(videos, random), stories: shuffle(stories, random) };
  try { storage?.setItem(COMMUNITY_SESSION_KEY, JSON.stringify(order)); } catch { /* Browsing remains available without storage. */ }
  return order;
}
