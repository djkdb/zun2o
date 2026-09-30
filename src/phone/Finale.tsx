import { useEffect, useState, type FormEvent } from 'react';
import { useGame } from '../hooks/useGame';
import { reachEnding, sfx, vibrate } from '../engine/director';
import { getState } from '../engine/state';
import { HomeScreen } from './HomeScreen';
import { VideoFeed } from '../art/phonePhotos';
import { GhostVisual } from '../art/Ghost';
import { speak } from '../audio/speech';
import { ARCHIVE, CONTINUATION_KEY, FIRST_KEEPER, plain } from '../content/archive';
import { CallIcon } from './CallIcon';
import { VIDEO_CALL_LINES } from '../content/calls';
import { setSave } from '../engine/state';
import { art } from '../art/photoArt';
import { VIDEO } from '../art/videos';

// ─────────────────────────────────────────────────────────────────────────
// 02:00. The clock stops, the phone floods, the home screen empties, 채원
// video-calls from inside the room, the index recites what you did, and you
// choose how the night ends.
// ─────────────────────────────────────────────────────────────────────────

type Step = 'freeze' | 'flood' | 'strip' | 'ring' | 'video' | 'dark' | 'recall' | 'choice' | 'key' | 'name' | 'sign' | 'off';

const FLOOD = [
  ['도현', '채원아'],
  ['엄마', '우리 딸 어디 있니'],
  ['도현', '채원아 제발'],
  ['발신자 정보 없음', '{name}, 시간 됐어요'],
  ['나에게', '살려줘'],
  ['발신자 정보 없음', '두 시예요. 이름을 적을 시간이에요'],
];

function useTyped(lines: string[], active: boolean, speed = 38): string[] {
  const [n, setN] = useState(0);
  const total = lines.reduce((a, l) => a + l.length + 8, 0);
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setN((x) => (x >= total ? x : x + 1)), speed);
    return () => clearInterval(iv);
  }, [active, total, speed]);
  const out: string[] = [];
  let left = n;
  for (const l of lines) {
    if (left <= 0) break;
    out.push(l.slice(0, left));
    left -= l.length + 8;
  }
  return out;
}

/** What the index says about you. Written once, when it speaks. */
function buildRecall(): string[] {
  const s = getState().save;
  const lines = [
    '야간 출입 기록 — 02:00:00',
    `방문자 #0027  ${s.playerName ?? '(이름을 알려 주지 않음)'}`,
    `이 폰을 집은 지 (당신 시계로) ${Math.max(1, Math.round((Date.now() - s.startedAtReal) / 60000))}분.`,
    `사진 ${s.seenPhotos.length}장을 보았습니다.`,
    s.flags.includes('read-mom') ? '채원 씨 어머니의 메시지도 읽었죠.' : '채원 씨 어머니의 메시지는 끝내 읽지 않았죠.',
  ];
  // What you did tonight, the most telling first. Never more than four:
  // it should feel like being known, not like a stat screen.
  const typed = [...s.inputs].reverse().map((e) => /(?:(?:발신자 정보 없음|발신자 표시제한|모르는 번호)에게|나에게(?:에게)?) 보낸 메시지 "(.+)"$/.exec(e)?.[1]).find(Boolean);
  const toMom = s.inputs.some((e) => /^엄마.*에게 보낸 메시지/.test(e));
  const personal: [boolean, string][] = [
    [s.flags.includes('named-her'), '그 이름을 저한테 보냈죠. 한동안 대답을 못 했어요. 그건 인정할게요.'],
    [!!typed, `“${typed}”라고 보냈죠. 다 적어 뒀어요.`],
    [toMom, '채원 씨 어머니께 답장하려고 했죠. 전송은 안 됐어요. 제가 막았으니까.'],
    [s.choices.c3 === 'chaewon', '채원 씨 이름을 먼저 불러 줬죠. 그 애가 울었어요.'],
    [s.flags.includes('dwelt'), '사진을 한참 들여다봤죠. 사진 속에서도 당신을 보고 있었어요.'],
    [s.flags.includes('zoomed-booth'), '부스 안의 당신을 확대해서 봤죠. 저도 거기서 봤어요.'],
    [s.flags.includes('hung-once') || (s.flags.includes('declined-once') && !s.flags.includes('missed-dohyun')), '도현 씨 전화를 끊었죠. 그래도 그 사람은 왔어요.'],
    [s.flags.includes('missed-dohyun') && !s.flags.includes('hung-once'), '도현 씨 전화, 받지 않았죠. 그래도 그 사람은 왔어요.'],
    [s.choices.c1 === 'silent', '처음부터 대답하지 않았죠. 그래도 전부 읽었잖아요.'],
    [s.flags.includes('refused-name'), '이름은 끝내 알려 주지 않았죠. 괜찮아요. 카드에 직접 쓰게 될 테니까.'],
    [s.flags.includes('heard-radio'), '1340에 전화도 걸었죠. 제 목소리, 들었잖아요.'],
    [s.flags.includes('read-hyunwoo'), '박현우 씨 기사도 읽었죠. 그러니까 알잖아요, 이게 어떻게 끝나는지.'],
  ];
  personal
    .filter(([on]) => on)
    .slice(0, 4)
    .forEach(([, line]) => lines.push(line));
  if (new Date().getHours() === 2) lines.push('그리고… 지금은 진짜로 새벽 두 시네요.');
  lines.push('#0025 박현우. #0026 윤채원. 그리고 #0027, 당신.');
  lines.push('다들 그 부스에서 폰을 주웠어요. 주운 사람은 들어오게 돼 있어요.');
  lines.push('도현 씨는 지금 제2서고 안에 있어요. 당신이 남지 않으면, 도현 씨가 남아요.');
  lines.push('이제 누군가는 안에 남아야 합니다.');
  return lines;
}

export function Finale() {
  const save = useGame((s) => s.save);
  const [step, setStep] = useState<Step>('freeze');
  const [flood, setFlood] = useState(0);
  const [stripped, setStripped] = useState(0);
  const [close, setClose] = useState(0);
  const [sub, setSub] = useState('');
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(0);
  const [scare, setScare] = useState(false);
  const [recall, setRecall] = useState<string[]>([]);
  const [pip, setPip] = useState(0);
  const [slide, setSlide] = useState(0);
  const [blackout, setBlackout] = useState(false);
  // The video call: the line breaks up as she gets close, and it won't hang up.
  const [unstable, setUnstable] = useState(false);
  const [noHangup, setNoHangup] = useState(false);
  // 채원's side of the call is a real clip; if it can't play, the drawn feed takes over.
  const [clipOk, setClipOk] = useState(true);

  // Scripted timeline up to the ringing video call.
  useEffect(() => {
    setSave({ clock: '02:00', battery: 2 });
    sfx('thud');
    vibrate([500]);
    const ts = [
      setTimeout(() => setStep('flood'), 1400),
      ...FLOOD.map((_, i) =>
        setTimeout(() => {
          setFlood(i + 1);
          sfx('ding');
        }, 1600 + i * 380),
      ),
      setTimeout(() => setStep('strip'), 4600),
      ...Array.from({ length: 8 }, (_, i) => setTimeout(() => setStripped(i + 1), 4800 + i * 420)),
      setTimeout(() => setStep('ring'), 8600),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  // Ringing: auto-answers after 6 s — she does not wait.
  useEffect(() => {
    if (step !== 'ring') return;
    const iv = setInterval(() => sfx('ding'), 900);
    const t = setTimeout(() => setStep('video'), 6000);
    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 'video') return;
    const sound = getState().save.sound;
    const say = (t: string) => {
      setSub(t);
      if (sound) speak(t, 'female');
    };
    const start = performance.now();
    const iv = setInterval(() => setClose(Math.min(1, (performance.now() - start) / 9500)), 80);
    const pipStart = performance.now() + 6500;
    const pipIv = setInterval(() => setPip(Math.max(0, Math.min(1, (performance.now() - pipStart) / 2600))), 80);
    const ts = [
      setTimeout(() => say(VIDEO_CALL_LINES[0]), 600),
      setTimeout(() => say(VIDEO_CALL_LINES[1]), 2800),
      setTimeout(() => {
        say(VIDEO_CALL_LINES[2]);
        sfx('whisper');
        setUnstable(true);
      }, 6500),
      setTimeout(() => {
        setScare(true);
        sfx('scream');
        vibrate([300, 60, 600]);
      }, 9200),
      setTimeout(() => {
        setScare(false);
        setStep('dark');
      }, 10600),
    ];
    return () => {
      clearInterval(iv);
      clearInterval(pipIv);
      ts.forEach(clearTimeout);
      setUnstable(false);
    };
  }, [step]);

  // After the scare: two seconds of black, then the index speaks.
  useEffect(() => {
    if (step !== 'dark') return;
    const t = setTimeout(() => {
      setRecall(buildRecall());
      setStep('recall');
    }, 1800);
    return () => clearTimeout(t);
  }, [step]);

  const typed = useTyped(recall, step === 'recall');
  const doneTyping = recall.length > 0 && typed.length === recall.length && typed[typed.length - 1] === recall[recall.length - 1];
  useEffect(() => {
    if (step === 'recall' && doneTyping) {
      const t = setTimeout(() => setStep('choice'), 900);
      return () => clearTimeout(t);
    }
  }, [step, doneTyping]);

  const foundKey = save.flags.includes('found-key');

  const submitKey = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const k = input.toUpperCase().replace(/\s/g, '').replace('해원', 'HAEWON').replace(/^HAEWON(\d)/, 'HAEWON-$1');
    if (k === CONTINUATION_KEY) {
      sfx('unlock');
      setInput('');
      setErr('');
      // wrong keys don't count against the name
      setTries(0);
      setStep('name');
    } else {
      sfx('error');
      const n = tries + 1;
      setTries(n);
      setErr(n >= 2 ? '코드가 맞지 않습니다. 기록 013에 적혀 있던 그 코드예요.' : '코드가 맞지 않습니다.');
    }
  };

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    // An empty box is not a wrong name.
    if (!input.trim()) return;
    if (input.replace(/\s/g, '') === FIRST_KEEPER) {
      sfx('ending');
      reachEnding('release');
      return;
    }
    const n = tries + 1;
    setTries(n);
    setInput('');
    setBlackout(true);
    sfx('thud');
    vibrate([200]);
    setTimeout(() => setBlackout(false), 1600);
    if (n >= 2) {
      setErr('그건 그녀의 이름이 아닙니다. 당신의 이름이 기록됩니다.');
      setTimeout(() => reachEnding('shift'), 2600);
    } else setErr('그건 그녀의 이름이 아닙니다. 한 번 더.');
  };

  const powerOff = () => {
    setStep('off');
    sfx('hangup');
    setTimeout(() => reachEnding('poweroff'), 1600);
  };

  const onSlide = (v: number) => {
    setSlide(v);
    if (v >= 0.97) powerOff();
  };

  const sign = (e: FormEvent) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setSave({ playerName: name.slice(0, 12) });
    sfx('ending');
    reachEnding('shift');
  };

  return (
    <div className={`finale step-${step}`}>
      {(step === 'freeze' || step === 'flood' || step === 'strip') && (
        <>
          <div className="finale-clock">02:00</div>
          <HomeScreen stripped={stripped} />
          <div className="finale-flood">
            {FLOOD.slice(0, flood).map(([who, text], i) => (
              <div key={i} className="flood-item">
                <strong>{who}</strong>
                <span>{text.replace('{name}', save.playerName ?? '방문자님')}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {step === 'ring' && (
        <div className="incoming video">
          <div className="call-backdrop video-ring" aria-hidden="true">
            {art('avatar-self') && <img src={art('avatar-self')} alt="" draggable={false} />}
          </div>
          <div className="incoming-top">
            <span className="call-avatar pic">{art('avatar-self') ? <img src={art('avatar-self')} alt="" draggable={false} /> : null}</span>
            <small className="video-kind">
              <VideoIcon /> 영상 통화
            </small>
            <h2>채원</h2>
            <p className="finale-auto">자동으로 연결됩니다…</p>
          </div>
          <div className="incoming-actions">
            <button type="button" className="decline" onClick={() => setStep('video')} aria-label="거절">
              <CallIcon down />
            </button>
            <button type="button" className="accept" onClick={() => setStep('video')} aria-label="받기">
              <CallIcon />
            </button>
          </div>
        </div>
      )}
      {step === 'video' && (
        <div className={`video-call${unstable ? ' unstable' : ''}`}>
          {clipOk && (
            <video className="video-clip" autoPlay muted playsInline preload="auto">
              <source src={VIDEO.videocall} type="video/mp4" />
              {/* the last source failing means nothing could play: fall back to the drawn feed */}
              <source src={VIDEO.videocallWebm} type="video/webm" onError={() => setClipOk(false)} />
            </video>
          )}
          <VideoFeed close={Math.min(close, 0.3)} pip={pip} clip={clipOk} />
          <div className="video-top">
            <strong>채원</strong>
            <span className="video-status">
              <span className={`video-signal s${close < 0.3 ? 3 : close < 0.62 ? 2 : 1}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {unstable ? '연결 상태 불안정' : `0:${String(Math.floor(close * 9.5)).padStart(2, '0')}`}
            </span>
          </div>
          {sub && (
            <p className="video-sub" aria-live="polite">
              <span className="sub-who">채원</span>
              <span>{sub}</span>
            </p>
          )}
          {noHangup && <p className="video-toast">통화를 종료할 수 없습니다</p>}
          <div className="video-controls">
            <button type="button" className="call-ctl" disabled>
              <span className="call-ctl-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                  <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              스피커
            </button>
            <button
              type="button"
              className="hangup"
              aria-label="통화 종료"
              onClick={() => {
                // She does not let you go.
                sfx('key');
                vibrate([40]);
                setNoHangup(true);
                setTimeout(() => setNoHangup(false), 1600);
              }}
            >
              <CallIcon down />
            </button>
            <button type="button" className="call-ctl" disabled>
              <span className="call-ctl-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 8h10a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM15 11l5-3v8l-5-3z" fill="currentColor" />
                </svg>
              </span>
              카메라 전환
            </button>
          </div>
        </div>
      )}
      {(step === 'recall' || step === 'choice' || step === 'key' || step === 'name' || step === 'sign') && (
        <div className="index-final">
          {(step === 'recall' ? typed : recall).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          {step === 'choice' && (
            <div className="final-choices">
              <p className="final-choices-title">하나를 고르십시오</p>
              <label className="power-slider">
                <span style={{ opacity: 1 - slide }}>밀어서 전원 끄기 — 도망친다 ›</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={slide}
                  onChange={(e) => onSlide(Number(e.target.value))}
                  onPointerUp={() => slide < 0.97 && setSlide(0)}
                  aria-label="밀어서 전원 끄기"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setInput(save.playerName ?? '');
                  setStep('sign');
                }}
              >
                <b>내가 남는다</b>
                <small>내가 안에 남는다. 채원과 도현은 풀려난다.</small>
              </button>
              <button type="button" disabled={!foundKey} onClick={() => setStep('key')}>
                <b>삭제 코드를 입력한다</b>
                <small>{foundKey ? '코드와 처음 갇힌 사람의 이름으로 기록을 지운다.' : '코드를 모른다.'}</small>
              </button>
            </div>
          )}
          {step === 'key' && (
            <form className="final-form" onSubmit={submitKey}>
              <label htmlFor="fk">삭제 코드</label>
              <input id="fk" autoFocus value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" autoCapitalize="characters" />
              <button type="submit">입력</button>
              {err && <p className="final-err">{err}</p>}
              {foundKey && <Reread id="r013" />}
              <button type="button" className="final-back" onClick={() => (setStep('choice'), setErr(''), setTries(0), setInput(''))}>
                …다른 선택
              </button>
            </form>
          )}
          {step === 'sign' && (
            <form className="final-form" onSubmit={sign}>
              <label htmlFor="fs">출입 기록에 당신의 이름을 적으십시오</label>
              <input id="fs" autoFocus value={input} maxLength={12} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
              <button type="submit" disabled={!input.trim()}>
                서명한다
              </button>
              <button type="button" className="final-back" onClick={() => setStep('choice')}>
                …아직은
              </button>
            </form>
          )}
          {step === 'name' && (
            <form className="final-form" onSubmit={submitName}>
              <label htmlFor="fn">처음 갇힌 사람의 이름</label>
              <input id="fn" autoFocus value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
              <button type="submit">입력</button>
              {err && <p className="final-err">{err}</p>}
              {save.flags.includes('read-miryeong') && <Reread id="r003" />}
              {tries === 0 && (
                <button type="button" className="final-back" onClick={() => (setStep('choice'), setErr(''), setInput(''))}>
                  …다른 선택
                </button>
              )}
            </form>
          )}
        </div>
      )}
      {step === 'off' && <div className="power-off" />}
      {blackout && <div className="blackout" />}
      {scare && (
        <div className={`scare scare-lunge${step === 'video' ? ' from-pip' : ''}${save.reduceFx ? ' scare-reduced' : ''}`}>
          <GhostVisual className="ghost" look="face" />
          <div className="scare-grain" />
        </div>
      )}
    </div>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style={{ verticalAlign: '-2px' }}>
      <path d="M4 7h10a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1zM16 10.5l5-3v9l-5-3z" fill="currentColor" />
    </svg>
  );
}

/** At 02:00 you can't open the browser any more — but what you already read, you can read again. */
function Reread({ id }: { id: 'r013' | 'r003' }) {
  const [open, setOpen] = useState(false);
  const page = ARCHIVE[id];
  if (!page) return null;
  return (
    <div className="reread">
      <button type="button" className="final-back" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? '닫기' : `${page.title.split(' — ')[0]} 다시 보기`}
      </button>
      {open && (
        <div className="reread-page">
          <strong>{page.title}</strong>
          {page.lines.map((l) => (
            <p key={l}>{plain(l)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

