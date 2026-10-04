import { useGame, usePhoneOwner, useTicker } from '../hooks/useGame';
import { HINT_TIER_MS, openApp } from '../engine/director';
import { APP_META, AppGlyph, appName } from './icons';
import type { AppId } from '../engine/types';
import { CalendarWidget } from './CalendarWidget';
import { art } from '../art/photoArt';
import { BoothPhoto } from '../art/phonePhotos';
import { isS2 } from '../content/season';
import { setRt } from '../engine/state';

// The last four sit in the dock, like a real iPhone (전화 · 인터넷 · 메시지 · 사진).
const ORDER: AppId[] = ['notes', 'memos', 'settings', 'phone', 'browser', 'messages', 'gallery'];
// …until someone rearranges it: the notes app in the dock, the photos up on the grid.
const SHUFFLED: AppId[] = ['memos', 'gallery', 'settings', 'phone', 'messages', 'browser', 'notes'];
const DOCK = 4;

export function HomeScreen({ stripped = 0 }: { stripped?: number }) {
  const unread = useGame((s) => s.save.unread);
  const installed = useGame((s) => s.save.installed);
  const shuffled = useGame((s) => s.save.shuffled);
  const choicePending = useGame((s) => s.save.choice !== null);
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0) + (choicePending ? 1 : 0);
  const base = shuffled ? SHUFFLED : ORDER;
  // grid first (with anything installed tonight), then the dock — the night strips them in that order
  const apps = [...base.slice(0, -DOCK), ...installed, ...base.slice(-DOCK)];
  const dockFrom = apps.length - DOCK;
  const chapter = useGame((s) => s.save.chapter);
  const opens = useGame((s) => s.save.opens);
  const obj = useGame((s) => s.save.objective);
  const now = useTicker(5000);
  const wallpaper = useGame((s) => s.save.wallpaper);
  const appGlitch = useGame((s) => s.rt.appGlitch);
  const vanish = useGame((s) => s.rt.vanishApp);
  const owner = usePhoneOwner();
  // Hint tier 2: the app to look in glows faintly — no words.
  const glow = obj?.app && now - obj.since > HINT_TIER_MS[1] ? obj.app : null;
  // The phone notices habits: from chapter 2 the app you open most sits a little off.
  const habit =
    chapter >= 2 && opens
      ? (Object.entries(opens).sort((a, b) => b[1] - a[1])[0]?.[0] as AppId | undefined)
      : undefined;

  const icon = (app: AppId, i: number) => {
    const gone = i < stripped;
    return (
      <button
        key={app}
        type="button"
        className={`app-icon${gone ? ' gone' : ''}${vanish === app ? ' vanished' : ''}${app === 'index' ? ' app-new' : ''}${glow === app ? ' hint-glow' : ''}${habit === app ? ' habit' : ''}`}
        onClick={(e) => {
          // the app grows out of its icon, like a real one
          const r = e.currentTarget.querySelector('.app-tile')?.getBoundingClientRect();
          const s = e.currentTarget.closest('.screen')?.getBoundingClientRect();
          if (r && s) setRt({ appOrigin: `${Math.round(r.left + r.width / 2 - s.left)}px ${Math.round(r.top + r.height / 2 - s.top)}px` });
          openApp(app);
        }}
        disabled={gone}
      >
        <span className="app-tile" style={{ background: APP_META[app].bg }}>
          <AppGlyph app={app} />
          {app === 'messages' && totalUnread > 0 && <span className="badge">{totalUnread}</span>}
        </span>
        <span className={`app-name${appGlitch?.app === app ? ' glitched' : ''}`}>{appGlitch?.app === app ? appGlitch.name : appName(app)}</span>
      </button>
    );
  };

  return (
    <div className={`home home-ch${chapter}`}>
      {/* 채원's own wallpaper — until the phone picks another one for you */}
      <div className="home-wall" aria-hidden="true">
        {isS2() ? (
          art('miryeong-daughter') && <img src={art('miryeong-daughter')} alt="" draggable={false} />
        ) : wallpaper === 'booth' ? (
          <BoothPhoto fill />
        ) : (
          (art('life-busstop') ?? art('avatar-self')) && <img src={art('life-busstop') ?? art('avatar-self')} alt="" draggable={false} />
        )}
      </div>
      {stripped === 0 && <CalendarWidget />}
      <div className="home-grid">{apps.slice(0, dockFrom).map((app, i) => icon(app, i))}</div>
      <div className={`home-dock-hint${owner.endsWith('의 휴대폰') && /^(채원|소연)/.test(owner) ? '' : ' changed'}`}>{owner}</div>
      {/* the search pill and the glass dock */}
      <div className="home-search" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10.4 10.4l3.2 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        검색
      </div>
      <div className="home-dock">{apps.slice(dockFrom).map((app, i) => icon(app, dockFrom + i))}</div>
    </div>
  );
}
