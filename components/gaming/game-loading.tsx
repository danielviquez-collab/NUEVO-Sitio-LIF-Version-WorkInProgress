'use client';
import { X } from 'lucide-react';

export function GameLoading({
  className = '',
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div className={`game-loading ${className}`}>
      {onClose && (
        <button
          type="button"
          className="game-icon-control game-loading-close"
          aria-label="Cerrar experiencia de juegos"
          title="Cerrar"
          onClick={onClose}
        >
          <X />
        </button>
      )}
      <output
        className="game-loading-status"
        aria-live="polite"
        aria-busy="true"
      >
        <strong>Cargando juegos LIF</strong>
        <span className="game-loading-track" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} style={{ animationDelay: `${index * 110}ms` }} />
          ))}
        </span>
      </output>
    </div>
  );
}
