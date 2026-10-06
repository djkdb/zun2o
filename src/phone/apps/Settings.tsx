import { useState } from 'react';
import { useGame, usePhoneOwner } from '../../hooks/useGame';
import { emit, newGame, openApp } from '../../engine/director';
import { hasFlag, setRt, setSave } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { photos } from '../../content/media';
import { audio } from '../../audio/engine';
import { setSpeechEnabled } from '../../audio/speech';

const ENDING_NAMES: Record<string, string> = {
  poweroff: '1. 전원 끄기',
  shift: '2. 남는 사람',
  release: '3. 기록 삭제',
  's2-daughter': '4. 딸',
  's2-instead': '5. 대신',
  's2-home': '6. 귀가',
};

/** iOS settings row icon: a white glyph on a small coloured rounded square. */
const GLYPH: Record<string, string> = {
  info: 'M10 4.2a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zM8.6 8.6h2.8v7.2H8.6z',
  battery: 'M3 7h12v6H3zM16 8.6h1.4v2.8H16z',
  storage: 'M4 5h12v3H4zM4 9.5h12v3H4zM4 14h12v1.6H4z',
  power: 'M9 3h2v7H9zM5.2 6.2l1.4 1.4a5 5 0 106.8 0l1.4-1.4a7 7 0 11-9.6 0z',
  sound: 'M3 7.5h3l4-3.5v12l-4-3.5H3zM12.5 7a4 4 0 010 6l-1-1a2.6 2.6 0 000-4zM14.6 5a7 7 0 010 10l-1-1a5.6 5.6 0 000-8z',
  access: 'M10 2.5a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM4 6.6l6 1.2 6-1.2.4 1.6-4.4 1v3l1.6 5.3-1.6.5L10 13l-2 5-1.6-.5L8 12.2v-3l-4.4-1z',
  hint: 'M10 2.8a5 5 0 013 9v2H7v-2a5 5 0 013-9zM7.6 15.2h4.8v1.6H7.6z',
  star: 'M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2-3.8-3.6 5.2-.8z',
  restart: 'M10 3.5a6.5 6.5 0 11-6.2 8.4l1.9-.6A4.5 4.5 0 1010 5.5V8L6 4.5 10 1z',
};
function Ico({ g, bg }: { g: keyof typeof GLYPH; bg: string }) {
  return (
    <i className="set-ico" style={{ background: bg }} aria-hidden="true">
      <svg viewBox="0 0 20 20">
        <path d={GLYPH[g]} fill="#fff" fillRule="evenodd" />
      </svg>
    </i>
  );
}

export function SettingsApp() {
  const save = useGame((s) => s.save);
  const owner = usePhoneOwner();
  const [confirm, setConfirm] = useState(false);

  const powerOff = () => {
    emit('power:try');
    setRt({
      dialog: hasFlag('ch4')
        ? { title: '전원을 끌 수 없습니다', body: '02:00 이전에는 종료할 수 없습니다.' }
        : { title: '전원을 끌 수 없습니다', body: '시스템이 사용 중입니다. (야간 출입 기록)' },
    });
  };

  return (
    <div className="settings">
      <AppHeader title="설정" onBack={() => openApp(null)} backLabel="홈" large />
      {/* the account card at the top, like a real iPhone's */}
      <section className="set-account" aria-label="계정">
        <span className="set-monogram" aria-hidden="true">
          {owner.replace(/^한/, '').charAt(0)}
        </span>
        <span>
          <strong>{owner.replace(/의 휴대폰$/, '')}</strong>
          <small>계정 · 클라우드 · 미디어 및 구입 항목</small>
        </span>
      </section>
      <section>
        <h3>휴대전화 정보</h3>
        <div className="row">
          <span>
            <Ico g="info" bg="#8e8e93" />
            이름
          </span>
          <span>{owner}</span>
        </div>
        <div className="row">
          <span>
            <Ico g="battery" bg="#34c759" />
            배터리
          </span>
          <span className={save.battery <= 10 ? 'warn' : undefined}>{save.battery}%{save.battery <= 10 ? ' · 빠르게 소모 중' : ''}</span>
        </div>
        <div className="row">
          <span>
            <Ico g="storage" bg="#8e8e93" />
            저장 공간
          </span>
          <span>
            사진 {photos().filter((p) => !p.extra || save.photos.includes(p.id)).length} · 녹음 {save.season === 2 ? 1 + save.memos.length : 1 + save.memos.length + (save.flags.includes('call1-done') ? 1 : 0)} · 알 수 없음 {hasFlag('ch4') ? '1.2GB' : '0'}
          </span>
        </div>
        <button type="button" className="row danger" onClick={powerOff}>
          <span>
            <Ico g="power" bg="#ff3b30" />
            전원 끄기
          </span>
        </button>
      </section>
      <section>
        <h3>게임</h3>
        <label className="row">
          <span>
            <Ico g="sound" bg="#ff2d55" />
            소리
          </span>
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
          <span>
            <Ico g="access" bg="#0a84ff" />
            효과 줄이기 (번쩍임·진동·흔들림, 무서운 장면 흐리게)
          </span>
          <input type="checkbox" checked={save.reduceFx} onChange={(e) => setSave({ reduceFx: e.target.checked })} />
        </label>
        {save.objective && (
          <button type="button" className="row nav" onClick={() => setRt({ hintOpen: true })}>
            <span>
              <Ico g="hint" bg="#ff9f0a" />
              지금 할 일 보기
            </span>
          </button>
        )}
        {([1, 2] as const).map((n) => {
          const mine = save.endings.filter((e) => e.startsWith('s2-') === (n === 2));
          return (
            <div className="row" key={n}>
              <span>
                <Ico g="star" bg={n === 1 ? '#5e5ce6' : '#bf5af2'} />
                본 엔딩 · 시즌 {n}
              </span>
              <span>
                {mine.length ? mine.map((e) => ENDING_NAMES[e]).join(', ') : '없음'} ({mine.length}/3)
              </span>
            </div>
          );
        })}
        {save.endings.some((e) => !e.startsWith('s2-')) && (
          <button type="button" className="row nav" onClick={() => newGame(save.season === 2 ? 1 : 2)}>
            <span>
              <Ico g="star" bg="#30b0c7" />
              {save.season === 2 ? '시즌 1 다시 하기' : '시즌 2 「귀가」 시작하기'}
            </span>
          </button>
        )}
        {!confirm ? (
          <button type="button" className="row nav" onClick={() => setConfirm(true)}>
            <span>
              <Ico g="restart" bg="#636366" />
              처음부터 다시 하기
            </span>
          </button>
        ) : (
          <button type="button" className="row danger" onClick={() => newGame()}>
            정말요? 진행 상황이 지워집니다 (엔딩 기록은 유지)
          </button>
        )}
        <p className="settings-note">이름·진행 기록은 이 기기에만 저장되며 어디로도 전송되지 않습니다. 이 게임은 카메라·마이크·위치를 사용하지 않습니다.</p>
      </section>
      {/* credits: where the voices, pictures and type come from */}
      <section className="set-credits">
        <h3>만든 것</h3>
        <div className="row">
          <span>음성 · 효과음</span>
          <span>ElevenLabs</span>
        </div>
        <div className="row">
          <span>사진 · 영상</span>
          <span>생성 AI로 제작</span>
        </div>
        <div className="row">
          <span>글꼴</span>
          <span>IBM Plex Sans KR · IBM Plex Mono · 나눔손글씨 펜 (SIL OFL)</span>
        </div>
        <p className="settings-note">이 이야기의 인물·학교·사건은 모두 지어낸 것입니다. 실제와 비슷한 이름이 있더라도 관계가 없습니다.</p>
      </section>
    </div>
  );
}
