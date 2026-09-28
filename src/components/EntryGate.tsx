import { useEffect, useRef } from 'react';
import { enterArchive, setAudioReady, setSoundPreference } from '../game/store';
import { useGame } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { audio } from '../utils/audio';
import { formatDuration, formatHM, msUntilNextTwo } from '../utils/time';
import { ANOMALIES } from '../data/anomalies';

// ─────────────────────────────────────────────────────────────────────────
// 입장 경고. 아날로그 호러식 경고문으로 "이것은 시간에 반응하는 체험"이라는
// 규칙을 먼저 알려 주고, 입장 버튼 클릭(사용자 제스처)으로 오디오를 켠다.
// 첫 방문은 전체 안내, 재방문은 짧게 — 그리고 사이트가 당신을 기억한다.
// ─────────────────────────────────────────────────────────────────────────

export function EntryGate() {
  const save = useGame((s) => s.save);
  const phase = useGame((s) => s.session.phase);
  const now = useLocalTime();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus({ preventScroll: true });
  }, []);

  const enter = async (withSound: boolean) => {
    setSoundPreference(withSound);
    if (withSound) {
      const ok = await audio.unlock();
      audio.setEnabled(true);
      setAudioReady(ok);
    } else {
      audio.setEnabled(false);
    }
    enterArchive();
  };

  const nowDate = new Date(now);
  const untilTwo = formatDuration(msUntilNextTwo(nowDate));
  const calm = save.flags.includes('ending-true');
  const twoAm = phase === 'after' && !calm;
  const returning = save.visitCount > 1;
  const secrets = Object.values(save.secretProgress).filter((p) => p.found).length;

  return (
    <div className={`gate${twoAm ? ' gate-night' : ''}`} role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-inner">
        {twoAm ? (
          <>
            <p className="gate-kicker">⚠ 경고</p>
            <h1 id="gate-title" className="gate-title">
              지금은 새벽 2시입니다.
            </h1>
            <p>이 사이트를 열지 말라고 했습니다.</p>
            <p>들어오지 마십시오.</p>
          </>
        ) : returning ? (
          <>
            <p className="gate-kicker">심야 기록보관소</p>
            <h1 id="gate-title" className="gate-title">
              {calm ? '어서 오세요, 기록사님.' : '다시 오셨네요.'}
            </h1>
            <ul className="gate-stats">
              <li>{save.visitCount}번째 방문</li>
              <li>
                발견한 이상현상 {save.discoveredAnomalies.length} / {ANOMALIES.length}
              </li>
              <li>비밀 {secrets} / 4</li>
            </ul>
          </>
        ) : (
          <>
            <p className="gate-kicker">⚠ 입장 전에 읽어 주십시오</p>
            <h1 id="gate-title" className="gate-title">
              심야 기록보관소
            </h1>
            <p>
              이 사이트는 <strong>당신 기기의 실제 시각</strong>에 반응합니다.
            </p>
            <p>오래 머물수록, 다시 찾아올수록, 새벽 2시에 가까워질수록 이곳은 조금씩 이상해집니다.</p>
            <p>
              기록을 읽으십시오. <strong>이상한 점</strong>을 찾으십시오.
              <br />
              막히면 <strong>열람 수첩</strong>이 다음 단서를 알려 줄 것입니다.
            </p>
            <p className="gate-rule">그리고 — 새벽 2시에는 이 사이트를 열지 마십시오.</p>
          </>
        )}
        <p className="gate-time">
          현재 시각 {formatHM(nowDate)} · 새벽 2시까지 {twoAm ? '00:00:00' : untilTwo}
        </p>
        <div className="gate-actions">
          <button ref={firstButton} type="button" className="gate-btn primary" onClick={() => enter(true)}>
            {twoAm ? '그래도 들어간다' : returning ? '입장 (소리 켬)' : '이어폰을 끼고 입장'}
          </button>
          <button type="button" className="gate-btn" onClick={() => enter(false)}>
            소리 없이 입장
          </button>
        </div>
        <p className="gate-note">갑작스러운 소리와 놀라게 하는 장면이 포함되어 있습니다. 진행 기록은 이 기기에만 저장됩니다.</p>
      </div>
    </div>
  );
}
