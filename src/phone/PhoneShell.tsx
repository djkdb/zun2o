import { useEffect, useState } from 'react';
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
    const arm = () => {
      clearTimeout(t);
      setIdle(false);
      t = setTimeout(() => {
        setIdle(true);
        const { save, rt } = getState();
        const key = `idle-refl-${save.chapter}`;
        if (save.chapter >= 1 && !save.flags.includes(key) && !rt.activeCall && !rt.incoming) {
          addFlag(key);
          setTimeout(() => {
            setRt({ scare: { kind: 'reflect', nonce: Date.now() } });
            sfx('whisper');
            setTimeout(() => setRt({ scare: null }), 380);
          }, 1800);
        }
      }, 25000);
    };
    arm();
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [active]);
  return idle && active;
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
    <div className={`shell chapter-${chapter}${idle ? ' idle' : ''}`}>
      <StatusBar dark={darkBar} />
      <div className="screen">{!unlocked ? <LockScreen /> : app ? <AppView app={app} /> : <HomeScreen />}</div>
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
