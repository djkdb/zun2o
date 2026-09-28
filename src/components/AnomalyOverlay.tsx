import { useEffect } from 'react';
import { usePeekAnomaly, useVisualLevel } from '../hooks/useGame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { LEVEL_PROFILES } from '../game/horrorEngine';

// Full-screen effect layers plus the scroll anomalies. Layers are always
// mounted (cheap, opacity-only) so switching them never causes layout work.

function useScrollAnomaly(): void {
  const scroll = usePeekAnomaly('scroll');
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!scroll) return;
    if (scroll.effect === 'drift') {
      if (window.scrollY > 120) window.scrollBy({ top: -90, behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    if (scroll.effect === 'stall') {
      const block = (e: Event) => e.preventDefault();
      const keys = (e: KeyboardEvent) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'End', 'Home'].includes(e.key)) e.preventDefault();
      };
      window.addEventListener('wheel', block, { passive: false });
      window.addEventListener('touchmove', block, { passive: false });
      window.addEventListener('keydown', keys);
      return () => {
        window.removeEventListener('wheel', block);
        window.removeEventListener('touchmove', block);
        window.removeEventListener('keydown', keys);
      };
    }
  }, [scroll, reduced]);
}

export function AnomalyOverlay() {
  const level = useVisualLevel();
  const screen = usePeekAnomaly('screen');
  const reduced = useReducedMotion();
  useScrollAnomaly();
  const persistent = LEVEL_PROFILES[level].persistentGrain;
  const effect = screen?.effect;
  return (
    <div aria-hidden="true">
      <div className={`fx-layer fx-grain${persistent || effect === 'tear' ? ' on' : ''}`} />
      <div className={`fx-layer fx-scanlines${level === 4 ? ' on' : ''}`} />
      <div className={`fx-layer fx-vignette${level >= 3 ? ' on' : ''}`} />
      <div className={`fx-layer fx-dim${effect === 'dim' ? ' on' : ''}`} />
      <div className={`fx-layer fx-dark${effect === 'dark' && !reduced ? ' on' : ''}`} />
      {effect === 'tear' && !reduced && <div key={screen?.nonce} className="fx-tear" />}
    </div>
  );
}
