import { useGame } from '../hooks/useGame';

// Home-screen widget. 채원 wrote one entry. Somebody else adds the second.
export function CalendarWidget() {
  const chapter = useGame((s) => s.save.chapter);
  const name = useGame((s) => s.save.playerName);
  return (
    <div className="widget">
      <div className="widget-date">
        <small>토요일</small>
        <strong>27</strong>
      </div>
      <ul className="widget-events">
        <li>
          <i style={{ background: '#e5a53a' }} />
          <span>01:00 해원군청 별관 촬영 🔦</span>
        </li>
        {chapter >= 3 && (
          <li className="widget-new">
            <i style={{ background: '#b33' }} />
            <span>02:00 근무 교대 — {name ?? '방문자'}</span>
          </li>
        )}
        {chapter < 3 && (
          <li className="widget-muted">
            <i />
            <span>다른 일정 없음</span>
          </li>
        )}
      </ul>
    </div>
  );
}
