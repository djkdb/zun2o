import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx, startOutgoing } from '../../engine/director';
import { setRt } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { CallIcon } from '../CallIcon';

// Fake dialer: nothing here ever places a real call.
const SPECIAL: Record<string, string> = { '1340': 'radio', '0200': 'line0200' };

export function PhoneApp() {
  const [tab, setTab] = useState<'recent' | 'keypad'>('recent');
  const [num, setNum] = useState('');
  const calls = useGame((s) => s.save.calls);

  const dial = () => {
    const n = num.replace(/\D/g, '');
    if (!n) return;
    emit(`dial:${n}`);
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
    sfx('hangup');
    setRt({ dialog: { title: who, body: '상대방이 전화를 받을 수 없습니다.' } });
    if (who === '엄마') emit('dial:mom');
  };

  return (
    <div className="phone-app">
      <AppHeader title={tab === 'recent' ? '최근 기록' : '키패드'} onBack={() => openApp(null)} backLabel="홈" />
      {tab === 'recent' ? (
        <ul className="call-list">
          {calls.map((c, i) => (
            <li key={i}>
              <button type="button" onClick={() => (c.who === '도현' || c.who === '엄마' ? callContact(c.who) : undefined)}>
                <span className={c.kind === 'missed' ? 'missed' : undefined}>
                  {c.who}
                  {c.count ? ` (${c.count})` : ''}
                </span>
                <small>{c.kind === 'missed' ? '부재중' : c.kind === 'out' ? '발신' : '수신'}</small>
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
          최근 기록
        </button>
        <button type="button" className={tab === 'keypad' ? 'on' : ''} onClick={() => setTab('keypad')}>
          키패드
        </button>
      </nav>
    </div>
  );
}
