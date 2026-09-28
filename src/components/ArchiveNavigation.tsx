import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { stageReached, useAnomaly, useGame, useMainEventStage, useVisualLevel } from '../hooks/useGame';
import { STRIP_INTERVAL, STRIP_ORDER } from '../data/mainEvent';
import { href } from '../utils/router';
import { seeded } from '../utils/random';

interface Item {
  key: string;
  label: string;
  path: string;
  className?: string;
}

const BASE: Item[] = [
  { key: 'archive', label: 'ARCHIVE', path: '/' },
  { key: 'records', label: 'RECORDS', path: '/records' },
  { key: 'search', label: 'SEARCH', path: '/search' },
  { key: 'about', label: 'ABOUT', path: '/about' },
  { key: 'contact', label: 'CONTACT', path: '/contact' },
];

const NIGHT: Item[] = [
  { key: 'archive', label: 'ARCHIVE', path: '/' },
  { key: 'records', label: 'RECORDS', path: '/records' },
  { key: '009', label: '009', path: '/record/009' },
  { key: 'unknown', label: 'UNKNOWN', path: '/unknown', className: 'unknown' },
  { key: 'leave', label: 'LEAVE', path: '/contact' },
];

function isCurrent(path: string, current: string): boolean {
  if (path === '/') return current === '/';
  return current === path || current.startsWith(`${path}/`);
}

export function ArchiveNavigation({ currentPath }: { currentPath: string }) {
  const level = useVisualLevel();
  const stage = useMainEventStage();
  const anomaly = useAnomaly('nav');
  const staffUnlocked = useGame((s) => s.save.flags.includes('system-unlocked'));
  const [stripped, setStripped] = useState(0);

  // 02:00 — menu items vanish one by one.
  const stripping = stage === 'strip-menu';
  useEffect(() => {
    if (!stripping) return;
    let n = 0;
    const t = setInterval(() => {
      n++;
      setStripped(n);
      if (n >= STRIP_ORDER.length) clearInterval(t);
    }, STRIP_INTERVAL);
    return () => {
      clearInterval(t);
      setStripped(0);
    };
  }, [stripping]);

  const eventRunning = stage !== 'idle' && stage !== 'done';
  const allGone = eventRunning && stageReached(stage, 'dark');
  const night = level >= 5 && !eventRunning;

  const items = useMemo(() => {
    let list = night ? NIGHT : BASE;
    if (!night && anomaly) {
      if (anomaly.effect === 'reorder') {
        const rng = seeded(anomaly.nonce);
        list = [...list].sort(() => rng() - 0.5);
      }
      if (anomaly.effect === 'phantom') {
        list = [...list.slice(0, 3), { key: 'staff', label: 'STAFF ONLY', path: '/system', className: 'phantom' }, ...list.slice(3)];
      }
      if (anomaly.effect === 'rename') {
        list = list.map((i) => (i.key === anomaly.payload?.from ? { ...i, label: String(anomaly.payload.text) } : i));
      }
    }
    return list;
  }, [night, anomaly]);

  const shiftIndex = anomaly?.effect === 'shift' ? Math.floor(seeded(anomaly.nonce)() * items.length) : -1;
  const goneKeys = new Set(STRIP_ORDER.slice(0, stripping ? stripped : 0));

  return (
    <nav className="nav" aria-label="Main">
      <ul>
        {items.map((item, i) => {
          const gone = allGone || goneKeys.has(item.key);
          const style: CSSProperties | undefined = i === shiftIndex ? { transform: 'translate(3px, 2px)' } : undefined;
          const pressed = anomaly?.effect === 'ghost-press' && anomaly.payload?.item === item.key;
          return (
            <li key={item.key} className={[item.className, gone ? 'gone' : ''].filter(Boolean).join(' ')} style={style} aria-hidden={gone || undefined}>
              <a
                href={href(item.path)}
                className={pressed ? 'ghost-press' : undefined}
                aria-current={isCurrent(item.path, currentPath) ? 'page' : undefined}
                tabIndex={gone ? -1 : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
        {staffUnlocked && !night && !eventRunning && (
          <li className="visually-hidden">
            <a href={href('/system')}>Staff terminal</a>
          </li>
        )}
      </ul>
    </nav>
  );
}
