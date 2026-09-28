import { useEffect, type ReactNode } from 'react';
import { ArchiveHeader } from './components/ArchiveHeader';
import { ArchiveNavigation } from './components/ArchiveNavigation';
import { Clock } from './components/Clock';
import { StatusPanel } from './components/StatusPanel';
import { Footer } from './components/Footer';
import { AnomalyOverlay } from './components/AnomalyOverlay';
import { AudioController } from './components/AudioController';
import { HorrorTransition } from './components/HorrorTransition';
import { NoticeToast } from './components/NoticeToast';
import { DebugPanel } from './components/DebugPanel';
import { JumpScare } from './components/Ghost';
import { EntryGate } from './components/EntryGate';
import { ReadingNotes } from './components/ReadingNotes';
import { IndexPage } from './pages/IndexPage';
import { RecordsPage } from './pages/RecordsPage';
import { RecordPage } from './pages/RecordPage';
import { SearchPage } from './pages/SearchPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { SystemPage } from './pages/SystemPage';
import { RoomPage } from './pages/RoomPage';
import { UnknownPage } from './pages/UnknownPage';
import { EndingPage } from './pages/EndingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { startDirector } from './game/director';
import { emit } from './game/store';
import { stageReached, useGame, useMainEventStage, usePeekAnomaly, useVisualLevel } from './hooks/useGame';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useRoute } from './hooks/useRoute';
import type { Route } from './utils/router';

interface Resolved {
  page: ReactNode;
  /** Full-screen pages replace the archive frame entirely. */
  fullscreen: boolean;
  title: string;
}

function resolve(route: Route): Resolved {
  const [a, b] = route.segments;
  switch (a) {
    case undefined:
      return { page: <IndexPage />, fullscreen: false, title: '기록 색인' };
    case 'records':
      return { page: <RecordsPage />, fullscreen: false, title: '전체 기록' };
    case 'record':
      return b
        ? { page: <RecordPage key={b} id={b} />, fullscreen: false, title: `기록 #${b}` }
        : { page: <RecordsPage />, fullscreen: false, title: '전체 기록' };
    case 'search':
      return { page: <SearchPage />, fullscreen: false, title: '검색' };
    case 'about':
      return { page: <AboutPage />, fullscreen: false, title: '소개' };
    case 'contact':
      return { page: <ContactPage />, fullscreen: false, title: '연락' };
    case 'unknown':
      return { page: <UnknownPage />, fullscreen: false, title: '기록 #017' };
    case 'room-02':
      return { page: <RoomPage />, fullscreen: false, title: '02호실' };
    case 'system':
      return { page: <SystemPage />, fullscreen: true, title: '시스템 접속' };
    case 'ending':
      return { page: <EndingPage id={b ?? ''} />, fullscreen: true, title: '심야 기록보관소' };
    default:
      return { page: <NotFoundPage path={route.path} />, fullscreen: true, title: '404 Not Found' };
  }
}

export function App() {
  const route = useRoute();
  const level = useVisualLevel();
  const stage = useMainEventStage();
  const reduced = useReducedMotion();
  const debug = useGame((s) => s.session.debug);
  const entered = useGame((s) => s.session.entered);
  const screen = usePeekAnomaly('screen');

  useEffect(() => startDirector(), []);

  // Theme + accessibility state lives on <html> so CSS can react globally.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.level = String(level);
    root.classList.toggle('reduce-fx', reduced);
  }, [level, reduced]);

  const resolved = resolve(route);

  useEffect(() => {
    window.scrollTo(0, 0);
    emit({ type: 'route', target: route.path.replace(/^\//, '') || 'index' });
  }, [route.path]);

  // The tab title belongs to the fiction too.
  useEffect(() => {
    const base = level >= 5 ? `02:00 — ${resolved.title}` : `${resolved.title} — 심야 기록보관소`;
    document.title = base;
    const onVis = () => {
      if (document.visibilityState === 'hidden' && level >= 3) document.title = '열람실을 떠나셨군요.';
      else document.title = base;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [level, resolved.title]);

  const eventRunning = stage !== 'idle' && stage !== 'done';
  const siteClass = [
    'site',
    screen?.effect === 'shake' && !reduced ? 'fx-shake' : '',
    screen?.effect === 'chroma' ? 'fx-chroma' : '',
    eventRunning && stageReached(stage, 'fade') && !stageReached(stage, 'dark') ? 'event-fade' : '',
    eventRunning && stageReached(stage, 'dark') && !stageReached(stage, 'navigate') ? 'event-dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        본문으로 건너뛰기
      </a>
      {resolved.fullscreen ? (
        resolved.page
      ) : (
        <div className={siteClass}>
          <ArchiveHeader />
          <ArchiveNavigation currentPath={route.path} />
          <div className="layout">
            <main id="main" tabIndex={-1}>
              {resolved.page}
            </main>
            <aside aria-label="보관소 정보">
              <Clock />
              <ReadingNotes />
              <StatusPanel />
            </aside>
          </div>
          <Footer />
        </div>
      )}
      <AnomalyOverlay />
      <AudioController />
      <HorrorTransition />
      <JumpScare />
      <NoticeToast />
      {!entered && <EntryGate />}
      {debug && <DebugPanel />}
    </>
  );
}
