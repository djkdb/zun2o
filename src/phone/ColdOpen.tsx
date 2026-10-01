import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { setSpeechEnabled } from '../audio/speech';
import { applyChapterMix, emit } from '../engine/director';
import { setRt, setSave } from '../engine/state';
import { art } from '../art/photoArt';
import { VIDEO } from '../art/videos';

const LINES = [
  '9월 27일 토요일, 밤 11시 51분.',
  '막차를 놓쳤다. 폐교된 해원고등학교 정문 앞, 비가 거세진다.',
  '비를 피해 들어온 공중전화부스. 선반 위에 누가 두고 간 휴대폰이 있다.',
  '어젯밤 이 학교에서 유튜버가 사라졌다는 기사가 떠오른다.',
  '그 순간, 화면이 켜진다. 배터리 12%.',
];

export function ColdOpen() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ts = LINES.map((_, i) => setTimeout(() => setN(i + 1), 700 + i * 1500));
    return () => ts.forEach(clearTimeout);
  }, []);

  const begin = async (sound: boolean) => {
    setSave({ started: true, sound, startedAtReal: Date.now() });
    if (sound) {
      const ok = await audio.unlock();
      audio.setEnabled(true);
      setRt({ audioReady: ok });
      applyChapterMix(5);
    } else audio.setEnabled(false);
    setSpeechEnabled(sound);
    emit('start');
  };

  // The words come with pictures: the Annex at night, then the booth shelf and the phone on it — which lights up.
  const scene = n >= 3 ? 'booth' : n >= 2 ? 'annex' : null;
  // The booth is a short muted clip: rain on the glass, the phone lights up — and stays lit.
  const [still] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [clipOk, setClipOk] = useState(true);
  const clip = useRef<HTMLVideoElement>(null);
  const useClip = !still && clipOk;
  useEffect(() => {
    // the shelf first, still; it lights up with the last line
    if (n < 4 || !useClip) return;
    void clip.current?.play().catch(() => setClipOk(false));
  }, [n, useClip]);
  return (
    <div className="coldopen">
      <div className="coldopen-scene" aria-hidden="true">
        {art('wallpaper') && <img className={`co-img${scene === 'annex' ? ' on' : ''}`} src={art('wallpaper')} alt="" draggable={false} />}
        {useClip ? (
          <video
            ref={clip}
            className={`co-img co-clip${scene === 'booth' ? ' on' : ''}`}
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
          art('booth-shelf') && <img className={`co-img co-booth${scene === 'booth' ? ' on' : ''}${n >= 5 ? ' lit' : ''}`} src={art('booth-shelf')} alt="" draggable={false} />
        )}
        {n >= 5 && !useClip && <span className="co-glow" />}
      </div>
      <div className="coldopen-lines">
        {LINES.slice(0, n).map((l, i) => (
          <p key={l} className={i === 0 ? 'co-stamp' : undefined}>
            {l}
          </p>
        ))}
      </div>
      <div className={`coldopen-actions${n >= LINES.length ? ' show' : ''}`}>
        <h1>12%</h1>
        <p className="co-sub">새벽 2시, 해원고 전화부스 괴담</p>
        <button type="button" className="primary" onClick={() => begin(true)}>
          집는다
        </button>
        <p>🎧 이어폰 권장 · 약 15–20분 · 갑작스러운 소리와 장면이 있습니다</p>
        <p>소리는 폰 안의 설정 앱에서 끌 수 있습니다.</p>
        <p className="coldopen-privacy">진행 기록은 이 기기에만 저장됩니다. 카메라·마이크·위치를 쓰지 않습니다.</p>
      </div>
    </div>
  );
}
