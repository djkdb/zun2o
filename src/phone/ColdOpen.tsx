import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { preloadVoices, setSpeechEnabled } from '../audio/speech';
import { applyChapterMix, emit, mix, newGame, sfx, vibrate } from '../engine/director';
import { useGame } from '../hooks/useGame';
import { isS2 } from '../content/season';
import { setRt, setSave } from '../engine/state';
import { art } from '../art/photoArt';
import { VIDEO } from '../art/videos';

/**
 * The cold open, played rather than read. One line on screen at a time:
 *   0 start      — earphones, sound on or off (the tap that is allowed to start audio)
 *   1 night      — black, rain coming in: the last bus is gone
 *   2 school     — the closed school in the rain; YOU run for the phone booth
 *   3 booth      — the shelf, a phone on it; a beat of nothing
 *   4 lit        — it lights up: a news push about the missing YouTuber, then "들어오세요."
 *   5 pick       — the title, and the choice to pick it up
 *   6 shut       — the door swings shut behind you; push it — it won't move (the game's stakes, felt first)
 */
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** The words of each step, per season. Season 2: a year later, the same booth — and this time the door stays open. */
const TEXT = {
  1: {
    stamp: '9월 27일 토요일 · 밤 11시 51분',
    night: '막차가 끊겼다.',
    school: '폐교된 해원고등학교 앞. 비가 쏟아진다.',
    run: '전화부스로 뛰어간다 ›',
    booth: '공중전화부스. 선반 위에 누가 두고 간 휴대폰.',
    notes: [
      { who: '해원일보', text: '[속보] 폐교 촬영 나선 20대 유튜버, 하루째 연락 두절' },
      { who: '발신자 정보 없음', text: '들어오세요.' },
    ],
    sub: '새벽 2시, 해원고 전화부스 괴담',
    shut: '등 뒤에서 전화부스 문이 닫혔다.',
    pushed: '꿈쩍도 하지 않는다. 손 안의 화면만 밝다.',
  },
  2: {
    stamp: '2026년 9월 27일 일요일 · 밤 11시 51분',
    night: '1년 뒤. 막차 시간은 외우고 있었다. 그런데도 놓쳤다.',
    school: '해원고 정문 앞. 1년 동안 비어 있던 선반.',
    run: '전화부스로 간다 ›',
    booth: '공중전화부스. 선반 위에 — 휴대폰.',
    notes: [
      { who: '엄마', text: '소연아 어디니' },
      { who: '발신자 정보 없음', text: '다시 들어오세요.' },
    ],
    sub: '시즌 2 — 귀가',
    shut: '등 뒤에서 문이 천천히 닫히다가, 멈췄다.',
    pushed: '문은 열려 있다. 나가도 된다. 아무도 막지 않는다.',
  },
} as const;

export function ColdOpen() {
  const [step, setStep] = useState<Step>(0);
  // re-render when the season switches under the start screen
  useGame((s) => s.save.season);
  const s2 = isS2();
  const T = TEXT[s2 ? 2 : 1];
  const s1Done = useGame((s) => s.save.endings.some((e) => !e.startsWith('s2-')));
  const sawRelease = useGame((s) => s.save.endings.includes('release'));
  const [sound, setSound] = useState(true);
  const [notes, setNotes] = useState(0);
  const [still] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [clipOk, setClipOk] = useState(true);
  const clip = useRef<HTMLVideoElement>(null);
  const useClip = !still && clipOk;

  const start = async (withSound: boolean) => {
    setSound(withSound);
    if (withSound) {
      const ok = await audio.unlock();
      audio.setEnabled(true);
      setRt({ audioReady: ok });
      preloadVoices();
      mix(0.32, 0, 2.5, 1100); // rain
    } else audio.setEnabled(false);
    setStep(1);
  };

  // The beats that move on by themselves (a tap moves them on sooner).
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 2600);
      return () => clearTimeout(t);
    }
    if (step === 3) {
      const t = setTimeout(() => setStep(4), 2400);
      return () => clearTimeout(t);
    }
    if (step === 4) {
      // the screen lights, it buzzes, two notifications land — then the title
      void clip.current?.play().catch(() => setClipOk(false));
      sfx('buzz');
      vibrate([60, 40, 60]);
      const ts = [
        setTimeout(() => setNotes(1), 700),
        setTimeout(() => (setNotes(2), sfx('buzz'), vibrate([60])), 2300),
        setTimeout(() => setStep(5), 4200),
      ];
      return () => ts.forEach(clearTimeout);
    }
  }, [step]);

  const run = () => {
    sfx('footsteps');
    mix(0.4, 0, 0.6, 1500);
    setStep(3);
  };

  // Season 2: as the line says the door is swinging shut, the clip shows it — and it stops halfway.
  useEffect(() => {
    if (step === 6 && s2 && useClip) void clip.current?.play().catch(() => {});
  }, [step, s2, useClip]);

  const [pushed, setPushed] = useState(false);
  const pick = () => {
    sfx('creak');
    setTimeout(() => (sfx('thud'), vibrate([90])), 700);
    setStep(6);
  };
  const push = () => {
    if (pushed) return;
    setPushed(true);
    sfx(isS2() ? 'creak' : 'thud');
    vibrate([40, 30, 40]);
    setTimeout(begin, 2300);
  };

  const begin = () => {
    setSave({ started: true, sound, startedAtReal: Date.now() });
    if (sound) applyChapterMix(5);
    setSpeechEnabled(sound);
    emit('start');
  };

  const tapOn = step === 1 || step === 3;
  return (
    <div className={`coldopen co-step-${step}`} onClick={tapOn ? () => setStep(step === 1 ? 2 : 4) : undefined}>
      <div className="coldopen-scene" aria-hidden="true">
        {(art('wall-lock') ?? art('wallpaper')) && <img className={`co-img${step === 2 ? ' on' : ''}`} src={art('wall-lock') ?? art('wallpaper')} alt="" draggable={false} />}
        {useClip ? (
          <video
            key={s2 ? 's2' : 's1'}
            ref={clip}
            className={`co-img co-clip${step >= 3 ? ' on' : ''}`}
            muted
            playsInline
            preload="auto"
            // the clip's own first frame: the dark phone on the shelf, nothing in the glass yet
            poster={s2 ? undefined : VIDEO.openingPoster}
            // the screen lights and holds — until, in season 2, the door swings in behind you (step 6)
            onTimeUpdate={(e) => e.currentTarget.currentTime > 3.6 && !(s2 && step === 6) && e.currentTarget.pause()}
            // a failing <source> also reaches here through React; only the video's own error counts
            onError={(e) => e.target === e.currentTarget && setClipOk(false)}
          >
            <source src={s2 ? VIDEO.s2opening : VIDEO.opening} type="video/mp4" />
            <source src={s2 ? VIDEO.s2openingWebm : VIDEO.openingWebm} type="video/webm" onError={() => setClipOk(false)} />
          </video>
        ) : (
          <img className={`co-img co-booth${step >= 3 ? ' on' : ''}${step >= 4 ? ' lit' : ''}`} src={VIDEO.openingPoster} alt="" draggable={false} />
        )}
        {step >= 4 && !useClip && <span className="co-glow" />}
      </div>

      {/* what lands on the phone's screen when it lights up */}
      {step >= 4 && step < 6 && (
        <div className="co-notes" aria-live="polite">
          {notes >= 1 && (
            <div className="co-note">
              <b>{T.notes[0].who}</b>
              <small>지금</small>
              <span>{T.notes[0].text}</span>
            </div>
          )}
          {notes >= 2 && (
            <div className="co-note her">
              <b>{T.notes[1].who}</b>
              <small>지금</small>
              <span>{T.notes[1].text}</span>
            </div>
          )}
        </div>
      )}

      {step === 0 && (
        <div className="co-start">
          {isS2() && <p className="co-season">시즌 2 「귀가」 · 시즌 1 엔딩 3 「기록 삭제」 1년 뒤{!sawRelease && ' (시즌 1 결말 스포일러 포함)'}</p>}
          <p className="co-stamp">{T.stamp}</p>
          <p className="co-ear">🎧 이어폰을 끼고, 소리를 켜 주세요.</p>
          <button type="button" className="primary co-go" onClick={() => void start(true)}>
            시작
          </button>
          <button type="button" className="co-silent" onClick={() => void start(false)}>
            소리 없이 하기
          </button>
          {s1Done && (
            <button type="button" className="co-silent co-switch" onClick={() => newGame(isS2() ? 1 : 2)}>
              {isS2() ? '‹ 시즌 1로' : '시즌 2 「귀가」 ›'}
            </button>
          )}
          <p className="co-fine">약 15–20분 · 갑작스러운 소리와 장면이 있습니다 · 소리는 폰 안의 설정 앱에서 끌 수 있습니다.</p>
          <p className="coldopen-privacy">진행 기록은 이 기기에만 저장됩니다. 카메라·마이크·위치를 쓰지 않습니다.</p>
        </div>
      )}

      {step >= 1 && step <= 3 && (
        <div className="co-line" key={step}>
          {step === 1 && <p className="co-stamp">밤 11시 51분</p>}
          <p>{step === 1 ? T.night : step === 2 ? T.school : T.booth}</p>
          {step === 2 && (
            <button type="button" className="co-act" onClick={run}>
              {T.run}
            </button>
          )}
        </div>
      )}
      {tapOn && <span className="co-tap">화면을 누르면 계속</span>}

      {step >= 1 && step < 5 && (
        <button
          type="button"
          className="co-skip"
          onClick={(e) => {
            e.stopPropagation();
            setNotes(2);
            setStep(5);
          }}
        >
          건너뛰기
        </button>
      )}

      <div className={`coldopen-actions${step === 5 ? ' show' : ''}`}>
        <h1>12%</h1>
        <p className="co-sub">{T.sub}</p>
        <button type="button" className="primary" onClick={pick}>
          집는다
        </button>
      </div>

      {step === 6 && (
        <div className={`co-line co-shut${pushed ? ' pushed' : ''}`} key={pushed ? 'b' : 'a'}>
          <p>{pushed ? T.pushed : T.shut}</p>
          {!pushed && (
            <button type="button" className="co-act co-push" onClick={push}>
              문을 민다
            </button>
          )}
        </div>
      )}
    </div>
  );
}
