import { useGame } from '../hooks/useGame';
import { openApp } from '../engine/director';
import { APP_META, AppGlyph } from './icons';
import type { AppId } from '../engine/types';
import { CalendarWidget } from './CalendarWidget';

const ORDER: AppId[] = ['messages', 'gallery', 'notes', 'memos', 'browser', 'phone', 'settings'];
const SHUFFLED: AppId[] = ['memos', 'settings', 'gallery', 'phone', 'messages', 'browser', 'notes'];

export function HomeScreen({ stripped = 0 }: { stripped?: number }) {
  const unread = useGame((s) => s.save.unread);
  const installed = useGame((s) => s.save.installed);
  const shuffled = useGame((s) => s.save.shuffled);
  const choicePending = useGame((s) => s.save.choice !== null);
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0) + (choicePending ? 1 : 0);
  const apps = [...(shuffled ? SHUFFLED : ORDER), ...installed];

  return (
    <div className="home">
      {stripped === 0 && <CalendarWidget />}
      <div className="home-grid">
        {apps.map((app, i) => {
          const gone = i < stripped;
          return (
            <button key={app} type="button" className={`app-icon${gone ? ' gone' : ''}${app === 'index' ? ' app-new' : ''}`} onClick={() => openApp(app)} disabled={gone}>
              <span className="app-tile" style={{ background: APP_META[app].bg }}>
                <AppGlyph app={app} />
                {app === 'messages' && totalUnread > 0 && <span className="badge">{totalUnread}</span>}
              </span>
              <span className="app-name">{APP_META[app].name}</span>
            </button>
          );
        })}
      </div>
      <div className="home-dock-hint">채원의 휴대폰</div>
    </div>
  );
}
