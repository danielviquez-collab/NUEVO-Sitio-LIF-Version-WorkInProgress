type PlayableMedia = Pick<HTMLMediaElement, 'muted' | 'play'>;
type PlaybackResult = 'playing' | 'blocked' | 'cancelled';
const errorName = (error: unknown) => typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string' ? error.name : '';

export async function playWithMutedFallback(media: PlayableMedia, isCurrent: () => boolean = () => true): Promise<PlaybackResult> {
  if (!isCurrent()) return 'cancelled';
  try {
    // The initial play call stays synchronous with the user's click or tap.
    await media.play();
    return isCurrent() ? 'playing' : 'cancelled';
  } catch (error) {
    if (!isCurrent() || errorName(error) === 'AbortError') return 'cancelled';
    if (errorName(error) !== 'NotAllowedError') throw error;
    if (media.muted) return 'blocked';
  }

  media.muted = true;
  try {
    await media.play();
    return isCurrent() ? 'playing' : 'cancelled';
  } catch (error) {
    if (!isCurrent() || errorName(error) === 'AbortError') return 'cancelled';
    if (errorName(error) === 'NotAllowedError') return 'blocked';
    throw error;
  }
}
