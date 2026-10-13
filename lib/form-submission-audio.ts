export const FORM_SEND_SOUND = '/audio/contact-send.wav';

let audio: HTMLAudioElement | undefined;
export function playFormSendSound() {
  try {
    if (sessionStorage.getItem('lif.games.mute') === '1') return;
    audio ??= new Audio(FORM_SEND_SOUND);
    audio.volume = 0.45;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // Audio support must never prevent sending the form.
  }
}
export function stopFormSendSound() {
  audio?.pause();
}
