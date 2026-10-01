import { useEffect, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { newGame, replayFinale, sfx } from '../engine/director';
import type { EndingId } from '../engine/types';
import { art } from '../art/photoArt';
import { VIDEO } from '../art/videos';
import { copula } from '../content/korean';

interface EndingDef {
  n: number;
  title: string;
  line: string;
  scene: { who?: string; text: string; side?: 'left' | 'right' }[];
}

const ENDINGS: Record<EndingId, EndingDef> = {
  poweroff: {
    n: 1,
    title: '전원 끄기',
    line: '당신은 도망쳤다. 02:00, 출입 기록에는 안에 남아 있던 도현의 이름이 남았다.',
    scene: [
      { text: '폰은 다시 켜지지 않았다.' },
      { text: '02:00. 해원고등학교 도서관 3층, 제2서고.' },
      { text: '방문자 #0027 — 도주. 방문자 #0028 강도현 — 안에 있음' },
      { text: '새벽 여섯 시, 전화부스 안에서 채원이 깨어났다. 도현의 이름을 부르면서.' },
      { text: '다음 날 밤, 같은 공중전화 부스. 선반 위에 휴대폰 한 대가 놓여 있다. 도현의 폰이다.' },
      { text: '화면이 켜진다. 배터리 12%.' },
      { text: '방문자 #0029 — 대기' },
      { who: '발신자 정보 없음', text: '들어오세요.', side: 'left' },
    ],
  },
  shift: {
    n: 2,
    title: '남는 사람',
    line: '누군가는 안에 남아야 한다. 오늘부터는 당신이다.',
    scene: [
      { who: '나에게', text: '…나왔어. 해가 떠', side: 'right' },
      { who: '도현', text: '채원이랑 같이 전화부스 안에서 깼어요. 둘 다 무사해요', side: 'left' },
      { who: '도현', text: '근데 당신은 어디 있어요? 이 폰만 선반에 있어요', side: 'left' },
      { text: '이름을 적는 사람 — {name}. 서미령의 이름은 31년 만에 지워졌다.' },
      { text: '열람실 의자에 외투 하나가 걸렸다. 31년 동안 걸려 있던 것과 자리만 같다.' },
      { text: '1년 뒤. 해원고 정문 앞 공중전화 부스.' },
      { who: '발신자 정보 없음', text: '들어오세요. 저는 {name}{이에요}. 오래 기다렸어요.', side: 'left' },
    ],
  },
  release: {
    n: 3,
    title: '기록 삭제',
    line: '아무도 더 기록되지 않는다. 아무도 남지 않아도 된다.',
    scene: [
      { who: '도현', text: '채원이랑 나왔어요!!! 둘 다 살아 있어요', side: 'left' },
      { who: '도현', text: '서랍이 전부 비어 있었어요. 카드가 한 장도 없었어요', side: 'left' },
      { who: '엄마', text: '누구신지 몰라도, 정말 고맙습니다', side: 'left' },
      { who: '발신자 정보 없음', text: '서미령이에요. 쓰지 말라고 한 건 제가 아니라 기록이었어요. 제 이름 불러 줘서 고마워요. 31년 만에 집에 가요.', side: 'left' },
      { text: '(대화 상대를 찾을 수 없습니다)' },
      { text: '열람실 의자에 31년 동안 걸려 있던 외투가 없어졌다.' },
      { text: '같은 새벽, 해원시의 한 아파트. 마흔두 살 여자가 잠에서 깼다. 현관에서 누가 “엄마 왔어” 하고 말한 것 같았다.' },
      { text: '다음 날 아침, 비가 그쳤다. 공중전화 부스의 선반은 비어 있다.' },
    ],
  },
};

export function EndingScreen({ id }: { id: EndingId }) {
  const def = ENDINGS[id];
  const playerName = useGame((s) => s.save.playerName);
  const name = playerName ?? '(이름 없음)';
  // In dialogue, someone who never gave a name is just their number.
  const spoken = playerName ?? '#0027';
  const endings = useGame((s) => s.save.endings);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    sfx('ending');
    const ts = def.scene.map((_, i) =>
      setTimeout(() => {
        setShown(i + 1);
        sfx(i === def.scene.length - 1 ? 'thud' : 'ding');
      }, 1400 + i * 1700),
    );
    return () => ts.forEach(clearTimeout);
  }, [def]);

  const done = shown >= def.scene.length;
  return (
    <div className={`ending ending-${id}`}>
      {/* the last photograph of the night, behind the words */}
      {art(`ending-${id}`) && <img className="ending-photo" src={art(`ending-${id}`)} alt="" />}
      {/* the true ending's last line comes with the morning: rain stopping over the empty phone booth */}
      {id === 'release' && <DawnClip on={shown >= def.scene.length} />}
      <div className="ending-scene">
        {def.scene.slice(0, shown).map((l, i) =>
          l.who ? (
            <div key={i} className={`ending-bubble ${l.side}`}>
              <small>{l.who}</small>
              <span>{l.text.replaceAll('{name}{이에요}', spoken + copula(spoken)).replaceAll('{name}', spoken)}</span>
            </div>
          ) : (
            <p key={i} className="ending-line">
              {l.text.replaceAll('{name}', name)}
            </p>
          ),
        )}
      </div>
      {done && (
        <div className="ending-card">
          <small>
            엔딩 {def.n} · 결말 3개 중 {endings.length}개 발견
          </small>
          <h2>{def.title}</h2>
          <p>{def.line}</p>
          {id === 'release' && new Date().getHours() === 2 && <p className="badge-real">★ 진짜 새벽 2시에 기록을 지웠습니다</p>}
          {endings.length < 3 && <p className="ending-more">다른 선택도 있습니다. 결말은 세 가지.</p>}
          {endings.length < 3 && (
            <button type="button" onClick={() => replayFinale() || newGame()}>
              02:00부터 다시 (다른 선택)
            </button>
          )}
          <button type="button" className={endings.length < 3 ? 'secondary' : undefined} onClick={newGame}>
            처음부터 다시 하기
          </button>
        </div>
      )}
    </div>
  );
}

/** Dawn over the empty booth. Muted unless the game's sound is on; still photo for reduced motion. */
function DawnClip({ on }: { on: boolean }) {
  const sound = useGame((s) => s.save.sound);
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(() => !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const v = ref.current;
    if (!on || !v) return;
    v.muted = !sound;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setOk(false));
    });
  }, [on, sound]);
  if (!ok) return null;
  return (
    <video ref={ref} className={`ending-photo ending-clip${on ? ' on' : ''}`} poster={VIDEO.dawnPoster} playsInline muted preload="auto" aria-hidden="true">
      <source src={VIDEO.dawn} type="video/mp4" />
      <source src={VIDEO.dawnWebm} type="video/webm" onError={() => setOk(false)} />
    </video>
  );
}
