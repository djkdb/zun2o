import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, newGame, openApp } from '../../engine/director';
import { hasFlag, setRt, setSave } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { audio } from '../../audio/engine';
import { setSpeechEnabled } from '../../audio/speech';

const ENDING_NAMES: Record<string, string> = { poweroff: '1. 전원 끄기', shift: '2. 교대', release: '3. 색인 종료' };

export function SettingsApp() {
  const save = useGame((s) => s.save);
  const [confirm, setConfirm] = useState(false);

  const powerOff = () => {
    emit('power:try');
    setRt({
      dialog: hasFlag('ch4')
        ? { title: '전원을 끌 수 없습니다', body: '02:00 이전에는 종료할 수 없습니다.' }
        : { title: '전원을 끌 수 없습니다', body: '시스템이 사용 중입니다. (야간 색인)' },
    });
  };

  return (
    <div className="settings">
      <AppHeader title="설정" onBack={() => openApp(null)} backLabel="홈" />
      <section>
        <h3>휴대전화 정보</h3>
        <div className="row">
          <span>이름</span>
          <span>채원의 휴대폰</span>
        </div>
        <div className="row">
          <span>배터리</span>
          <span className={save.battery <= 10 ? 'warn' : undefined}>{save.battery}%{save.battery <= 10 ? ' · 빠르게 소모 중' : ''}</span>
        </div>
        <div className="row">
          <span>저장 공간</span>
          <span>사진 12 · 녹음 2 · 알 수 없음 {hasFlag('ch4') ? '1.2GB' : '0'}</span>
        </div>
        <button type="button" className="row danger" onClick={powerOff}>
          전원 끄기
        </button>
      </section>
      <section>
        <h3>게임</h3>
        <label className="row">
          <span>소리</span>
          <input
            type="checkbox"
            checked={save.sound}
            onChange={async (e) => {
              const on = e.target.checked;
              setSave({ sound: on });
              if (on) await audio.unlock();
              audio.setEnabled(on);
              setSpeechEnabled(on);
            }}
          />
        </label>
        <label className="row">
          <span>효과 줄이기 (번쩍임·진동·흔들림)</span>
          <input type="checkbox" checked={save.reduceFx} onChange={(e) => setSave({ reduceFx: e.target.checked })} />
        </label>
        <div className="row">
          <span>본 엔딩</span>
          <span>{save.endings.length ? save.endings.map((e) => ENDING_NAMES[e]).join(', ') : '없음'} ({save.endings.length}/3)</span>
        </div>
        {!confirm ? (
          <button type="button" className="row" onClick={() => setConfirm(true)}>
            처음부터 다시 하기
          </button>
        ) : (
          <button type="button" className="row danger" onClick={newGame}>
            정말요? 진행 상황이 지워집니다 (엔딩 기록은 유지)
          </button>
        )}
        <p className="settings-note">이름·진행 기록은 이 기기에만 저장되며 어디로도 전송되지 않습니다. 이 게임은 카메라·마이크·위치를 사용하지 않습니다.</p>
      </section>
    </div>
  );
}
