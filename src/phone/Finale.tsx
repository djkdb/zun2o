import { useEffect, useState, type FormEvent } from 'react';
import { useGame } from '../hooks/useGame';
import { reachEnding, sfx, vibrate } from '../engine/director';
import { getState } from '../engine/state';
import { HomeScreen } from './HomeScreen';
import { VideoFeed } from '../art/phonePhotos';
import { GhostVisual } from '../art/Ghost';
import { speak } from '../audio/speech';
import { CONTINUATION_KEY, FIRST_KEEPER } from '../content/archive';
import { CallIcon } from './CallIcon';
import { setSave } from '../engine/state';

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
  ['모르는 번호', '{name}, 시간 됐어요'],
  ['나에게', '살려줘'],
  ['모르는 번호', '근무 교대 시간입니다'],
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
    '야간 색인 — 02:00:00',
    `방문자 #0027  ${s.playerName ?? '(이름을 알려 주지 않음)'}`,
    `이 폰을 집은 지 ${Math.max(1, Math.round((Date.now() - s.startedAtReal) / 60000))}분.`,
    `사진 ${s.seenPhotos.length}장을 보았습니다.`,
    s.flags.includes('read-mom') ? '채원 씨 어머니의 메시지도 읽었죠.' : '채원 씨 어머니의 메시지는 끝내 읽지 않았죠.',
  ];
  if (s.choices.c1 === 'silent') lines.push('처음부터 대답하지 않았죠. 그래도 전부 읽었잖아요.');
  if (s.choices.c3 === 'chaewon') lines.push('채원 씨 이름을 먼저 불러 줬죠. 그 애가 울었어요.');
  if (s.flags.includes('refused-name')) lines.push('이름은 끝내 알려 주지 않았죠. 괜찮아요. 카드에 직접 쓰게 될 테니까.');
  if (s.flags.includes('heard-radio')) lines.push('1340에 전화도 걸었죠. 제 목소리, 들었잖아요.');
  // Something the player actually typed tonight, quoted back.
  const typed = [...s.inputs].reverse().map((e) => /보낸 메시지 "(.+)"$/.exec(e)?.[1]).find(Boolean);
  if (typed) lines.push(`“${typed}”라고 보냈죠. 다 적어 뒀어요.`);
  if (s.flags.includes('named-her')) lines.push('그 이름을 저한테 보냈죠. 한동안 대답을 못 했어요. 그건 인정할게요.');
  if (new Date().getHours() === 2) lines.push('그리고… 지금은 진짜로 새벽 두 시네요.');
  lines.push('이제 누군가는 근무를 서야 합니다.');
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
      setTimeout(() => say('…들려?'), 600),
      setTimeout(() => say('여기 너무 어두워. 서랍 소리가 멈추질 않아'), 2800),
      setTimeout(() => {
        say('잠깐. 네 카메라… 네 뒤에—');
        sfx('whisper');
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
    const k = input.toUpperCase().replace(/\s/g, '').replace('해원', 'HAEWON').replace(/^HAEWON(\d)/, 'HAEWON-$1');
    if (k === CONTINUATION_KEY) {
      sfx('unlock');
      setInput('');
      setErr('');
      setStep('name');
    } else {
      sfx('error');
      setErr('열쇠가 맞지 않습니다.');
    }
  };

  const submitName = (e: FormEvent) => {
    e.preventDefault();
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
      setErr('그건 그녀의 이름이 아닙니다. 색인이 당신을 등록합니다.');
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
          <div className="incoming-top">
            <small>영상 통화</small>
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
        <div className="video-call">
          <VideoFeed close={Math.min(close, 0.3)} pip={pip} />
          <div className="video-label">채원 · 영상 통화</div>
          <p className="video-sub">{sub}</p>
        </div>
      )}
      {(step === 'recall' || step === 'choice' || step === 'key' || step === 'name' || step === 'sign') && (
        <div className="index-final">
          {(step === 'recall' ? typed : recall).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          {step === 'choice' && (
            <div className="final-choices">
              <label className="power-slider">
                <span style={{ opacity: 1 - slide }}>밀어서 전원 끄기 ›</span>
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
                내가 남는다 — 채원을 보내 준다
              </button>
              <button type="button" disabled={!foundKey} onClick={() => setStep('key')}>
                {foundKey ? '연장 열쇠를 입력한다' : '연장 열쇠를 입력한다 (열쇠를 모른다)'}
              </button>
            </div>
          )}
          {step === 'key' && (
            <form className="final-form" onSubmit={submitKey}>
              <label htmlFor="fk">연장 열쇠</label>
              <input id="fk" autoFocus value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" autoCapitalize="characters" />
              <button type="submit">입력</button>
              {err && <p className="final-err">{err}</p>}
            </form>
          )}
          {step === 'sign' && (
            <form className="final-form" onSubmit={sign}>
              <label htmlFor="fs">근무자 카드에 이름을 적으십시오</label>
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
              <label htmlFor="fn">첫 번째 근무자의 이름</label>
              <input id="fn" autoFocus value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
              <button type="submit">입력</button>
              {err && <p className="final-err">{err}</p>}
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
