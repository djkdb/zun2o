import { useGame } from '../hooks/useGame';
import { openApp } from '../engine/director';
import { StatusBar } from './StatusBar';
import { LockScreen } from './LockScreen';
import { HomeScreen } from './HomeScreen';
import { ColdOpen } from './ColdOpen';
import { Finale } from './Finale';
import { EndingScreen } from './Ending';
import { BannerView, CallScreen, ChapterCard, DialogView, GlitchOverlay, HintChip, IncomingCall, ScareOverlay } from './Overlays';
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

export function PhoneShell() {
  const started = useGame((s) => s.save.started);
  const unlocked = useGame((s) => s.save.unlocked);
  const app = useGame((s) => s.rt.app);
  const finale = useGame((s) => s.rt.finale);
  const ending = useGame((s) => s.rt.ending);
  const chapter = useGame((s) => s.save.chapter);

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

  const darkBar = !unlocked || app === null || app === 'index' || app === 'memos';
  return (
    <div className={`shell chapter-${chapter}`}>
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
    </div>
  );
}
