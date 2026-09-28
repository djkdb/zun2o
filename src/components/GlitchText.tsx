import { memo, useMemo, type CSSProperties, type ElementType } from 'react';
import type { ActiveAnomaly } from '../game/types';
import { seeded } from '../utils/random';

// Renders a string that anomalies can disturb. The component knows a small
// vocabulary of text effects; which one plays (and when) is decided by the
// HorrorEngine and passed in as `anomaly`.

const MIRROR: Record<string, string> = { E: 'Ǝ', N: 'И', R: 'Я', A: '∀', C: 'Ɔ', K: 'ꓘ', H: 'H', I: 'I' };

interface Props {
  text: string;
  anomaly?: ActiveAnomaly | null;
  as?: ElementType;
  className?: string;
}

function repeatWord(text: string, word: string | undefined, rngSeed: number): string {
  const words = text.split(' ');
  let idx = word ? words.findIndex((w) => w.toLowerCase().replace(/[^a-z]/g, '') === word.toLowerCase()) : -1;
  if (idx < 0) {
    const rng = seeded(rngSeed);
    const candidates = words.map((w, i) => (w.replace(/[^A-Za-z]/g, '').length > 3 ? i : -1)).filter((i) => i >= 0);
    idx = candidates[Math.floor(rng() * candidates.length)] ?? Math.floor(words.length / 2);
  }
  const w = words[idx];
  words.splice(idx, 1, w, w, w, w);
  return words.join(' ');
}

function GlitchTextInner({ text, anomaly, as: Tag = 'span', className }: Props) {
  const content = useMemo(() => {
    if (!anomaly) return null;
    const payloadText = typeof anomaly.payload?.text === 'string' ? anomaly.payload.text : undefined;
    switch (anomaly.effect) {
      case 'replace':
        return payloadText ?? text;
      case 'append':
        return text + (payloadText ?? '');
      case 'reverse':
        return [...text].reverse().join('');
      case 'repeat':
        return repeatWord(text, typeof anomaly.payload?.word === 'string' ? anomaly.payload.word : undefined, anomaly.nonce);
      case 'swap-letter': {
        const rng = seeded(anomaly.nonce);
        const indices = [...text].map((ch, i) => (MIRROR[ch.toUpperCase()] ? i : -1)).filter((i) => i >= 0);
        const target = indices[Math.floor(rng() * indices.length)];
        return [...text].map((ch, i) =>
          i === target ? (
            <span key={i} className="glitch-swap">
              {ch}
            </span>
          ) : (
            ch
          ),
        );
      }
      case 'vanish': {
        const rng = seeded(anomaly.nonce);
        const span = Math.max(1, anomaly.until - anomaly.startedAt - 1200);
        return [...text].map((ch, i) => {
          const style = { '--d': `${Math.floor(rng() * span)}ms` } as CSSProperties;
          return (
            <span key={i} className="ch" style={style}>
              {ch}
            </span>
          );
        });
      }
      default:
        return null;
    }
  }, [anomaly, text]);

  if (content === null) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag className={[className, anomaly?.effect === 'vanish' ? 'vanishing' : ''].filter(Boolean).join(' ')}>
      <span aria-hidden="true">{content}</span>
      <span className="visually-hidden">{text}</span>
    </Tag>
  );
}

export const GlitchText = memo(GlitchTextInner);
