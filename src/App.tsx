import { PhoneShell } from './phone/PhoneShell';
import { DebugPanel } from './DebugPanel';
import { useGame } from './hooks/useGame';

export function App() {
  const debug = useGame((s) => s.rt.debug);
  const reduce = useGame((s) => s.save.reduceFx);
  return (
    <div className={`stage${reduce ? ' reduce-fx' : ''}`}>
      <div className="device">
        <PhoneShell />
      </div>
      <aside className="stage-note" aria-hidden="true">
        <p>새벽 2시의 휴대폰</p>
        <p>휴대폰에서 “홈 화면에 추가”로 설치하면 앱처럼 전체 화면으로 즐길 수 있습니다. 이어폰 권장.</p>
      </aside>
      {debug && <DebugPanel />}
    </div>
  );
}
