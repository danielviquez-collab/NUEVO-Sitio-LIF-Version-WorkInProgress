'use client';

import { useEffect, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';

export function FormSubmissionStatus({
  busy,
  message,
  detail,
  className = '',
}: {
  busy: boolean;
  message: string;
  detail?: string;
  className?: string;
}) {
  const copy = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!busy) return;
    const frame = requestAnimationFrame(() => {
      copy.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    const keepPendingOpen = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault();
    };
    document.addEventListener('keydown', keepPendingOpen, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keepPendingOpen, true);
    };
  }, [busy]);

  return (
    <output
      className={`form-submission-status ${className}`}
      aria-live="polite"
      aria-atomic="true"
      hidden={!busy}
    >
      {busy && (
        <span ref={copy} className="form-submission-copy">
          <LoaderCircle aria-hidden="true" />
          <strong>{message}</strong>
          {detail && <span>{detail}</span>}
          <span className="form-submission-notice">
            No cerrés esta ventana hasta recibir la confirmación.
          </span>
        </span>
      )}
    </output>
  );
}
