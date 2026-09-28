import { useEffect, useState } from 'react';
import { audio } from '../audio/engine';
import { setSpeechEnabled } from '../audio/speech';
import { applyChapterMix, emit } from '../engine/director';
import { setRt, setSave } from '../engine/state';

const LINES = ['9월 27일 토요일, 밤 11시 51분.', '폐쇄된 해원군청 별관 앞.', '공중전화 부스 선반 위에 휴대폰 한 대가 놓여 있다.', '화면이 켜진다. 배터리 12%.'];

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

  return (
    <div className="coldopen">
      <div className="coldopen-lines">
        {LINES.slice(0, n).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <div className={`coldopen-actions${n >= LINES.length ? ' show' : ''}`}>
        <h1>새벽 2시의 휴대폰</h1>
        <button type="button" className="primary" onClick={() => begin(true)}>
          폰을 집는다 🎧
        </button>
        <button type="button" onClick={() => begin(false)}>
          소리 없이 집는다
        </button>
        <p>이어폰 권장 · 약 15–20분 · 갑작스러운 소리와 장면이 있습니다</p>
        <p className="coldopen-privacy">진행 기록은 이 기기에만 저장됩니다. 카메라·마이크·위치를 쓰지 않습니다.</p>
      </div>
    </div>
  );
}
