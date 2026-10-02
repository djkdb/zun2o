import { useGame, usePhoneOwner, useTicker } from '../hooks/useGame';
import { HINT_TIER_MS, openApp } from '../engine/director';
import { APP_META, AppGlyph } from './icons';
import type { AppId } from '../engine/types';
import { CalendarWidget } from './CalendarWidget';
import { art } from '../art/photoArt';
import { BoothPhoto } from '../art/phonePhotos';

const ORDER: AppId[] = ['messages', 'gallery', 'notes', 'memos', 'browser', 'phone', 'settings'];
const SHUFFLED: AppId[] = ['memos', 'settings', 'gallery', 'phone', 'messages', 'browser', 'notes'];

export function HomeScreen({ stripped = 0 }: { stripped?: number }) {
  const unread = useGame((s) => s.save.unread);
  const installed = useGame((s) => s.save.installed);
  const shuffled = useGame((s) => s.save.shuffled);
  const choicePending = useGame((s) => s.save.choice !== null);
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0) + (choicePending ? 1 : 0);
  const apps = [...(shuffled ? SHUFFLED : ORDER), ...installed];
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

  return (
    <div className={`home home-ch${chapter}`}>
      {/* 채원's own wallpaper — until the phone picks another one for you */}
      <div className="home-wall" aria-hidden="true">
        {wallpaper === 'booth' ? <BoothPhoto fill /> : (art('life-busstop') ?? art('avatar-self')) && <img src={art('life-busstop') ?? art('avatar-self')} alt="" draggable={false} />}
      </div>
      {stripped === 0 && <CalendarWidget />}
      <div className="home-grid">
        {apps.map((app, i) => {
          const gone = i < stripped;
          return (
            <button
              key={app}
              type="button"
              className={`app-icon${gone ? ' gone' : ''}${vanish === app ? ' vanished' : ''}${app === 'index' ? ' app-new' : ''}${glow === app ? ' hint-glow' : ''}${habit === app ? ' habit' : ''}`}
              onClick={() => openApp(app)}
              disabled={gone}
            >
              <span className="app-tile" style={{ background: APP_META[app].bg }}>
                <AppGlyph app={app} />
                {app === 'messages' && totalUnread > 0 && <span className="badge">{totalUnread}</span>}
              </span>
              <span className={`app-name${appGlitch?.app === app ? ' glitched' : ''}`}>{appGlitch?.app === app ? appGlitch.name : APP_META[app].name}</span>
            </button>
          );
        })}
      </div>
      <div className={`home-dock-hint${owner.startsWith('채원') ? '' : ' changed'}`}>{owner}</div>
    </div>
  );
}
