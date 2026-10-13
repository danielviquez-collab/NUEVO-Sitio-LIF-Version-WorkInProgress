'use client';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { acquireMediaOverlay } from '@/lib/media-priority';
import { setGameSessionPhase } from '@/lib/game-session';

export function GameModal({
  dialogRef,
  closing,
  onCancel,
  onClosed,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  closing: boolean;
  onCancel: () => void;
  onClosed: () => void;
  children: ReactNode;
}) {
  const cancel = useRef(onCancel);
  const isClosing = useRef(closing);
  useLayoutEffect(() => {
    cancel.current = onCancel;
    isClosing.current = closing;
  }, [onCancel, closing]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const release = acquireMediaOverlay();
    const preventNativeClose = (event: Event) => {
      event.preventDefault();
      if (!isClosing.current) cancel.current();
    };
    const requestKeyboardClose = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !dialog.open) return;
      event.preventDefault();
      if (!isClosing.current) cancel.current();
    };
    // Native cancellation must wait for the experience's guarded exit flow.
    dialog.addEventListener('cancel', preventNativeClose);
    document.addEventListener('keydown', requestKeyboardClose, true);
    setGameSessionPhase('lif-experience', 'paused');
    dialog.showModal();
    return () => {
      dialog.removeEventListener('cancel', preventNativeClose);
      document.removeEventListener('keydown', requestKeyboardClose, true);
      dialog.close();
      document.body.style.overflow = overflow;
      release();
      setGameSessionPhase('lif-experience', null);
    };
  }, [dialogRef]);
  useEffect(() => {
    if (!closing) return;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 80
      : 260;
    const timer = window.setTimeout(onClosed, duration);
    return () => clearTimeout(timer);
  }, [closing, onClosed]);
  return (
    <dialog
      ref={dialogRef}
      className="lif-game-dialog"
      aria-label="Juegos LIF"
      data-closing={closing}
      inert={closing}
    >
      {children}
    </dialog>
  );
}
