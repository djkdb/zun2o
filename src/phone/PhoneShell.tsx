import { useEffect, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { addFlag, getState, setRt } from '../engine/state';
import { sfx } from '../engine/director';
import { openApp } from '../engine/director';
import { StatusBar } from './StatusBar';
import { LockScreen } from './LockScreen';
import { HomeScreen } from './HomeScreen';
import { ColdOpen } from './ColdOpen';
import { Finale } from './Finale';
import { EndingScreen } from './Ending';
import { BannerView, CallScreen, ChapterCard, DialogView, GlitchOverlay, HintChip, IncomingCall, RebootOverlay, ScareOverlay } from './Overlays';
import { MessagesApp } from './apps/Messages';
import { GalleryApp } from './apps/Gallery';
import { NotesApp } from './apps/Notes';
import { MemosApp } from './apps/Memos';
import { BrowserApp } from './apps/Browser';
import { PhoneApp } from './apps/PhoneApp';
import { SettingsApp } from './apps/Settings';
import { IndexApp } from './apps/IndexApp';
import type { AppId } from '../engine/types';

function AppView({ app }: { app: AppId }) {
  switch (app) {
    case 'messages':
      return <MessagesApp />;
    case 'gallery':
      return <GalleryApp />;
    case 'notes':
      return <NotesApp />;
    case 'memos':
      return <MemosApp />;
    case 'browser':
      return <BrowserApp />;
    case 'phone':
      return <PhoneApp />;
    case 'settings':
      return <SettingsApp />;
    case 'index':
      return <IndexApp />;
  }
}

/**
 * Put the phone down for 25 s and its screen dims like a real one — and in
 * the dark glass, once per chapter, something is standing behind you.
 */
function useIdleDim(active: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    // The reflection's own timers: cleared with everything else, so a stale
    // one can never fire into a call, the finale or a new game.
    const inner: ReturnType<typeof setTimeout>[] = [];
    const arm = () => {
      clearTimeout(t);
      setIdle(false);
      t = setTimeout(() => {
        setIdle(true);
        const { save, rt } = getState();
        const key = `idle-refl-${save.chapter}`;
        if (save.chapter >= 1 && !save.flags.includes(key) && !rt.activeCall && !rt.incoming && !rt.scare) {
          addFlag(key);
          inner.push(
            setTimeout(() => {
              setRt({ scare: { kind: 'reflect', nonce: Date.now() } });
              sfx('whisper');
              inner.push(setTimeout(() => setRt({ scare: null }), 380));
            }, 1800),
          );
        }
      }, 25000);
    };
    arm();
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      clearTimeout(t);
      inner.forEach(clearTimeout);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [active]);
  return idle && active;
}

/**
 * Swipe in from the left edge to go back, like a real phone. Runs in the
 * capture phase so a photo swipe underneath doesn't also fire.
 */
function useEdgeBack() {
  const start = useRef<{ x: number; y: number } | null>(null);
  const onTouchStartCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    const r = e.currentTarget.getBoundingClientRect();
    start.current = t.clientX - r.left < 24 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEndCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    if (t.clientX - s.x > 70 && Math.abs(t.clientY - s.y) < 60) {
      const back = e.currentTarget.querySelector<HTMLButtonElement>('.back, .index-back');
      if (back) {
        e.stopPropagation();
        back.click();
      }
    }
  };
  return { onTouchStartCapture, onTouchEndCapture };
}

export function PhoneShell() {
  const started = useGame((s) => s.save.started);
  const unlocked = useGame((s) => s.save.unlocked);
  const app = useGame((s) => s.rt.app);
  const finale = useGame((s) => s.rt.finale);
  const ending = useGame((s) => s.rt.ending);
  const chapter = useGame((s) => s.save.chapter);
  const busy = useGame((s) => s.rt.activeCall !== null || s.rt.incoming !== null || s.rt.app === 'memos');
  const idle = useIdleDim(started && unlocked && !finale && !ending && !busy);
  const dip = useGame((s) => s.rt.dip);
  const edge = useEdgeBack();

  if (!started) return <ColdOpen />;
  if (ending) return <EndingScreen id={ending} />;
  if (finale)
    return (
      <div className="shell">
        <StatusBar dark />
        <div className="screen">
          <Finale />
        </div>
      </div>
    );

  const darkBar = !unlocked || app === null || app === 'index';
  return (
    <div className={`shell chapter-${chapter}${idle ? ' idle' : ''}${dip ? ' dip' : ''}`}>
      <StatusBar dark={darkBar} />
      <div className="screen" {...edge}>
        {!unlocked ? (
          <LockScreen />
        ) : app ? (
          <div key={app} className="app-frame">
            <AppView app={app} />
          </div>
        ) : (
          <div key="home" className="home-frame">
            <HomeScreen />
          </div>
        )}
      </div>
      {unlocked && (
        <button type="button" className="homebar" onClick={() => openApp(null)} aria-label="홈으로">
          <span />
        </button>
      )}
      <HintChip />
      <BannerView />
      <IncomingCall />
      <CallScreen />
      <ChapterCard />
      <DialogView />
      <GlitchOverlay />
      <ScareOverlay />
      <RebootOverlay />
    </div>
  );
}
