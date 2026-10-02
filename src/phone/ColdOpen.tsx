import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { preloadVoices, setSpeechEnabled } from '../audio/speech';
import { applyChapterMix, emit, mix, sfx, vibrate } from '../engine/director';
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
 */
type Step = 0 | 1 | 2 | 3 | 4 | 5;

export function ColdOpen() {
  const [step, setStep] = useState<Step>(0);
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
        {art('wallpaper') && <img className={`co-img${step === 2 ? ' on' : ''}`} src={art('wallpaper')} alt="" draggable={false} />}
        {useClip ? (
          <video
            ref={clip}
            className={`co-img co-clip${step >= 3 ? ' on' : ''}`}
            muted
            playsInline
            preload="auto"
            poster={art('booth-shelf')}
            onTimeUpdate={(e) => e.currentTarget.currentTime > 3.6 && e.currentTarget.pause()}
            // a failing <source> also reaches here through React; only the video's own error counts
            onError={(e) => e.target === e.currentTarget && setClipOk(false)}
          >
            <source src={VIDEO.opening} type="video/mp4" />
            <source src={VIDEO.openingWebm} type="video/webm" onError={() => setClipOk(false)} />
          </video>
        ) : (
          art('booth-shelf') && <img className={`co-img co-booth${step >= 3 ? ' on' : ''}${step >= 4 ? ' lit' : ''}`} src={art('booth-shelf')} alt="" draggable={false} />
        )}
        {step >= 4 && !useClip && <span className="co-glow" />}
      </div>

      {/* what lands on the phone's screen when it lights up */}
      {step >= 4 && (
        <div className="co-notes" aria-live="polite">
          {notes >= 1 && (
            <div className="co-note">
              <b>해원일보</b>
              <small>지금</small>
              <span>[속보] 폐교 촬영 나선 20대 유튜버, 하루째 연락 두절</span>
            </div>
          )}
          {notes >= 2 && (
            <div className="co-note her">
              <b>발신자 정보 없음</b>
              <small>지금</small>
              <span>들어오세요.</span>
            </div>
          )}
        </div>
      )}

      {step === 0 && (
        <div className="co-start">
          <p className="co-stamp">9월 27일 토요일 · 밤 11시 51분</p>
          <p className="co-ear">🎧 이어폰을 끼고, 소리를 켜 주세요.</p>
          <button type="button" className="primary co-go" onClick={() => void start(true)}>
            시작
          </button>
          <button type="button" className="co-silent" onClick={() => void start(false)}>
            소리 없이 하기
          </button>
          <p className="co-fine">약 15–20분 · 갑작스러운 소리와 장면이 있습니다 · 소리는 폰 안의 설정 앱에서 끌 수 있습니다.</p>
          <p className="coldopen-privacy">진행 기록은 이 기기에만 저장됩니다. 카메라·마이크·위치를 쓰지 않습니다.</p>
        </div>
      )}

      {step >= 1 && step <= 3 && (
        <div className="co-line" key={step}>
          {step === 1 && <p className="co-stamp">밤 11시 51분</p>}
          <p>{step === 1 ? '막차가 끊겼다.' : step === 2 ? '폐교된 해원고등학교 앞. 비가 쏟아진다.' : '공중전화부스. 선반 위에 누가 두고 간 휴대폰.'}</p>
          {step === 2 && (
            <button type="button" className="co-act" onClick={run}>
              전화부스로 뛰어간다 ›
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
        <p className="co-sub">새벽 2시, 해원고 전화부스 괴담</p>
        <button type="button" className="primary" onClick={begin}>
          집는다
        </button>
      </div>
    </div>
  );
}
