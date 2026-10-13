'use client';
import { useEffect } from 'react';

export function HeroSnake() {
  useEffect(() => {
    window.dispatchEvent(new Event('lif:snake-route'));
    return () => {
      window.dispatchEvent(new Event('lif:snake-route'));
    };
  }, []);
  return null;
}
