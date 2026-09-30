import { useGame } from '../hooks/useGame';

// Home-screen widget. 채원 wrote one entry. As the night goes on, somebody
// else fills in the rest — in the same calendar, in the same font.
export function CalendarWidget() {
  const chapter = useGame((s) => s.save.chapter);
  const name = useGame((s) => s.save.playerName);
  const dohyunIn = useGame((s) => s.save.flags.includes('dohyun-in'));
  const events: { time: string; text: string; color: string; wrong?: boolean }[] = [{ time: '01:00', text: '해원고 폐교 촬영 🔦', color: '#e5a53a' }];
  if (chapter >= 2) events.push({ time: '00:47', text: '통화 — 도현', color: '#3d6fd6', wrong: true });
  if (chapter >= 3) events.push({ time: '02:00', text: `근무 교대 — ${name ?? '방문자'}`, color: '#b33', wrong: true });
  if (dohyunIn) events.push({ time: '01:56', text: '입실 — 박도현', color: '#b33', wrong: true });
  return (
    <div className="widget">
      <div className="widget-date">
        <small>토요일</small>
        <strong>27</strong>
      </div>
      <ul className="widget-events">
        {events.map((e) => (
          <li key={e.text} className={e.wrong ? 'widget-new' : undefined}>
            <i style={{ background: e.color }} />
            <span>
              {e.time} {e.text}
            </span>
          </li>
        ))}
        {events.length === 1 && (
          <li className="widget-muted">
            <i />
            <span>다른 일정 없음</span>
          </li>
        )}
      </ul>
    </div>
  );
}
