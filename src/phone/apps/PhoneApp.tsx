import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { callBack, emit, openApp, sfx, startOutgoing } from '../../engine/director';
import { logInput, setRt } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { Avatar } from '../Avatar';
import type { ThreadId } from '../../engine/types';
import { CallIcon } from '../CallIcon';

// Fake dialer: nothing here ever places a real call.
const SPECIAL: Record<string, string> = { '1340': 'radio', '0200': 'line0200' };

/** The letters under the dial digits (CSS draws them, so a key's text stays its digit). */
const DIAL_LETTERS: Record<string, string> = { '0': '+', '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ' };

export function PhoneApp() {
  const [tab, setTab] = useState<'recent' | 'keypad'>('recent');
  const [num, setNum] = useState('');
  const calls = useGame((s) => s.save.calls);

  const dial = () => {
    const n = num.replace(/\D/g, '');
    if (!n) return;
    emit(`dial:${n}`);
    logInput(`${n}에 전화`);
    setNum('');
    if (SPECIAL[n]) {
      startOutgoing(SPECIAL[n]);
      return;
    }
    sfx('error');
    setRt({
      dialog: {
        title: '통화할 수 없음',
        body: n === '112' || n === '119' ? '서비스 지역이 아닙니다. 신호가 너무 약합니다.' : '연결할 수 없는 번호입니다.',
      },
    });
  };

  const callContact = (who: string) => {
    if (callBack(who)) return;
    sfx('hangup');
    setRt({ dialog: { title: who, body: '상대방이 전화를 받을 수 없습니다.' } });
    if (who === '엄마') emit('dial:mom');
  };

  return (
    <div className="phone-app">
      <AppHeader title={tab === 'recent' ? '최근 기록' : '키패드'} onBack={() => openApp(null)} backLabel="홈" large={tab === 'recent'} />
      {tab === 'recent' ? (
        <ul className="call-list">
          {calls.map((c, i) => (
            <li key={i}>
              <button type="button" className="call-row" onClick={() => (c.who === '도현' || c.who === '엄마' ? callContact(c.who) : undefined)}>
                <CallerPic who={c.who} />
                <span className="call-row-text">
                  <strong className={c.kind === 'missed' ? 'missed' : undefined}>
                    {c.who}
                    {c.count ? ` (${c.count})` : ''}
                  </strong>
                  <small>
                    <i className={`call-kind-icon ${c.kind}`} aria-hidden="true">
                      {c.kind === 'out' ? '↗' : '↙'}
                    </i>
                    {CONTACT[c.who] ? '휴대전화' : '알 수 없음'} · {c.kind === 'missed' ? '부재중' : c.kind === 'out' ? '발신' : '수신'}
                    {c.duration ? ` ${c.duration}` : ''}
                  </small>
                </span>
                <time>{c.time}</time>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dialer">
          <div className="dial-number">{num || ' '}</div>
          <div className="keypad dial">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                type="button"
                className="key"
                data-sub={DIAL_LETTERS[k]}
                onClick={() => {
                  sfx('key');
                  setNum((x) => (x + k).slice(0, 13));
                }}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="dial-actions">
            <span />
            <button type="button" className="dial-call" onClick={dial} aria-label="통화">
              <CallIcon />
            </button>
            <button type="button" className="dial-del" onClick={() => setNum((x) => x.slice(0, -1))} aria-label="지우기">
              ⌫
            </button>
          </div>
        </div>
      )}
      <nav className="tabbar">
        <button type="button" className={tab === 'recent' ? 'on' : ''} onClick={() => setTab('recent')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5.5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          최근 기록
        </button>
        <button type="button" className={tab === 'keypad' ? 'on' : ''} onClick={() => setTab('keypad')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={6 + c * 6} cy={4.5 + r * 6} r="2" fill="currentColor" />))}
            <circle cx="12" cy="22.5" r="2" fill="currentColor" />
          </svg>
          키패드
        </button>
      </nav>
    </div>
  );
}

const CONTACT: Record<string, ThreadId> = { 도현: 'dohyun', 엄마: 'mom', '발신자 정보 없음': 'unknown' };

function CallerPic({ who }: { who: string }) {
  const th = CONTACT[who];
  if (th) return <Avatar th={th} size={40} />;
  return (
    <span className="avatar pic call-pic-default" style={{ width: 40, height: 40 }} aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#5a5c63" />
        <circle cx="20" cy="15" r="7" fill="#c9cacf" />
        <path d="M6 40c0-9 6-13 14-13s14 4 14 13z" fill="#c9cacf" />
      </svg>
    </span>
  );
}

