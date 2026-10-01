import { useGame } from '../hooks/useGame';
import { today } from '../content/threads';

// Home-screen widget. 채원 wrote one entry. As the night goes on, somebody
// else fills in the rest — in the same calendar, in the same font.
export function CalendarWidget() {
  const chapter = useGame((s) => s.save.chapter);
  const name = useGame((s) => s.save.playerName);
  const dohyunIn = useGame((s) => s.save.flags.includes('dohyun-in'));
  const clock = useGame((s) => s.save.clock);
  const dohyunCall = useGame((s) => s.save.calls.find((c) => c.who === '도현' && !c.count && (c.kind === 'in' || c.kind === 'missed') && Number(c.time.slice(0, 2)) < 12));
  const day = today(clock);
  // 채원's own entry was for the 27th; past midnight the calendar shows the 28th.
  const events: { time: string; text: string; color: string; wrong?: boolean }[] =
    day.d === 27
      ? [
          { time: '01:00', text: '해원고 폐교 촬영 🔦', color: '#e5a53a' },
          { time: '18:00', text: '엄마 생신 🎂 케이크!!', color: '#d4589a' },
        ]
      : [{ time: '15:00', text: '편집 · 업로드 (1만 가자)', color: '#5aa36b' }];
  if (chapter >= 2) events.push({ time: dohyunCall?.time ?? '00:31', text: '통화 — 도현', color: '#3d6fd6', wrong: true });
  // 2장: an entry nobody made, with no title. 3장: it has one.
  if (chapter === 2) events.push({ time: '02:00', text: '', color: '#777', wrong: true });
  if (chapter >= 3) events.push({ time: '02:00', text: `이름 기록 — ${name ?? '방문자'}`, color: '#b33', wrong: true });
  if (dohyunIn) events.push({ time: '01:56', text: '입실 — 강도현', color: '#b33', wrong: true });
  return (
    <div className="widget">
      <div className="widget-date">
        <small>{day.weekday}</small>
        <strong>{day.d}</strong>
      </div>
      <ul className="widget-events">
        {events.map((e) => (
          <li key={e.time + e.text} className={e.wrong ? 'widget-new' : undefined}>
            <i style={{ background: e.color }} />
            <span>
              {e.time} {e.text}
            </span>
          </li>
        ))}
        {events.length <= 1 && (
          <li className="widget-muted">
            <i />
            <span>다른 일정 없음</span>
          </li>
        )}
      </ul>
    </div>
  );
}
