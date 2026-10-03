import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { newGame, replayFinale, sfx } from '../engine/director';
import { getState } from '../engine/state';
import type { EndingId, Save } from '../engine/types';
import { art, type ArtSlot } from '../art/photoArt';
import { VIDEO } from '../art/videos';
import { copula } from '../content/korean';

interface EndingDef {
  n: number;
  title: string;
  line: string;
  scene: { who?: string; text: string; side?: 'left' | 'right'; img?: ArtSlot }[];
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
      { who: '도현', text: '근데 그쪽은 어디 있어요? 이 폰만 선반에 있어요', side: 'left' },
      { text: '이름을 적는 사람 — {name}. 처음 적힌 사람의 이름은 31년 만에 지워졌다.' },
      { text: '열람실 의자에 외투 하나가 걸렸다. 31년 동안 걸려 있던 것과 자리만 같다.', img: 'chair-coat' },
      { text: '1년 뒤. 해원고 정문 앞 공중전화 부스.' },
      { who: '발신자 정보 없음', text: '들어오세요. 저는 {name}{이에요}. 오래 기다렸어요.', side: 'left' },
    ],
  },
  release: {
    n: 3,
    title: '기록 삭제',
    line: '이제 아무도 적히지 않는다. 남을 사람도 없다.',
    scene: [
      { who: '도현', text: '채원이랑 나왔어요!!! 둘 다 살아 있어요', side: 'left' },
      { who: '도현', text: '서랍 다 비어 있었어요 카드 한 장도 없어요', side: 'left' },
      { who: '도현', text: '(채원) 엄마한테 전화했어요 미역국 아직 있대요 ㅠㅠ', side: 'left' },
      { who: '엄마', text: '누구신지는 모르지만 정말 감사합니다 복받으실거에요', side: 'left' },
      { who: '발신자 정보 없음', text: '서미령이에요.', side: 'left' },
      { who: '발신자 정보 없음', text: '그때 쓰지 말라고 한 거, 제 말 아니었어요. 불러 줘서 고마워요. 집에 갈게요.', side: 'left' },
      { text: '(대화 상대를 찾을 수 없습니다)' },
      { text: '열람실 의자에 31년 동안 걸려 있던 외투가 없어졌다.', img: 'chair-empty' },
      { text: '같은 새벽, 해원시의 한 아파트. 마흔두 살 여자가 잠에서 깼다. 현관에서 누가 “엄마 왔어” 하고 말한 것 같았다.', img: 'miryeong-daughter' },
      { text: '다음 날 아침, 비가 그쳤다. 공중전화 부스의 선반은 비어 있다.' },
    ],
  },
  // ── 시즌 2 「귀가」 ──
  's2-daughter': {
    n: 4,
    title: '딸',
    line: '딸이 엄마 대신 남았다. 이번엔 엄마가 기다린다.',
    scene: [
      { who: '채원', text: '도현이 나왔어요!! 전화부스에서 자고 있었어요', side: 'left' },
      { who: '채원', text: '근데 언니가 안 나와요', side: 'left' },
      { who: '채원', text: '(도현) 안에서 소연 씨가 저 깨웠어요. 문까지 데려다주고 다시 들어갔어요', side: 'left' },
      { text: '02:00. 노트의 마지막 줄: 9월 28일 02:00 — 한소연.' },
      { text: '그 뒤로 엄마 손에 잉크가 묻는 일은 없었다.' },
      { text: '10월 28일 02:00. 제2서고 서랍에 카드가 한 장 늘었다. 이름을 적은 글씨는 소연의 것이었다.', img: art('s2-card') ? 's2-card' : 'index-card' },
      { text: '엄마는 매일 밤 창가에 앉아 있다. 마흔한 살의 얼굴로.' },
      { who: '엄마', text: '소연이가 두 시 전에는 온다고 했어요.', side: 'left' },
    ],
  },
  's2-instead': {
    n: 5,
    title: '대신',
    line: '누군가는 안에 남아야 한다. 소연 대신, 당신이다.',
    scene: [
      { who: '나에게', text: '…나왔어요. 해가 떠요', side: 'right' },
      { who: '나에게', text: '엄마한테 가요. 고마워요. 근데 그쪽은요?', side: 'right' },
      { who: '채원', text: '도현이랑 언니 둘 다 전화부스에서 깼어요. 이 폰만 선반에 있어요', side: 'left' },
      { who: '채원', text: '(도현) 작년엔 입구에서 기다리기만 했잖아요. 이번엔 제가 정문에서 기다릴게요. 그쪽 나올 때까지', side: 'left' },
      { text: '02:00. 노트의 마지막 줄: “한소” 위에 줄. 그 아래 — {name}.' },
      { text: '엄마 손은 그날 이후 다시는 볼펜을 쥐지 않았다.' },
      { text: '1년 뒤. 해원고 정문 앞 공중전화 부스. 선반 위에 휴대폰 한 대.', img: 'booth-shelf' },
      { who: '발신자 정보 없음', text: '들어오세요. 저는 {name}{이에요}.', side: 'left' },
    ],
  },
  's2-home': {
    n: 6,
    title: '귀가',
    line: '기록은 끝났다. 엄마는 1년 동안 집에 있었다.',
    scene: [
      { text: '기록 013 (사본) — 삭제되었습니다. 이 기록을 보는 사람: 0' },
      { who: '채원', text: '도현이 나왔어요. 언니도요!!!', side: 'left' },
      { who: '채원', text: '(도현) 안에서 소연 씨가 밤새 어머니 얘기만 했어요. 문 열리자마자 집으로 뛰어갔어요', side: 'left' },
      { who: '나에게', text: '엄마한테 전화가 안 돼요', side: 'right' },
      { text: '새벽 여섯 시, 소연은 집 현관문을 열었다. 학교에 들고 갔던 노트가 식탁 위에 펼쳐져 있었다.' },
      { text: '열한 개의 이름 위에 줄이 그어져 있었다. 마지막 장에는 이름 대신 한 줄.' },
      { text: '“소연아 엄마 왔다 간다.”', img: 'miryeong-daughter' },
      { text: '의자에 걸려 있던 외투가 없었다.' },
      { text: '공중전화 부스 선반은 그 뒤로 쭉 비어 있었다.' },
    ],
  },
};

/** Season 2's last photographs, behind the words. */
const S2_BG: Partial<Record<EndingId, ArtSlot>> = { 's2-daughter': 'reading-empty', 's2-instead': 'booth-shelf', 's2-home': art('s2-ending-home') ? 's2-ending-home' : 'ending-release' };

/** The night as you played it: who you kept out, whether she has your name. */
function endingFor(id: EndingId, save: Save): EndingDef {
  const { flags, choices } = save;
  const base = ENDINGS[id];
  const keptOut = flags.includes('kept-out');
  let scene = base.scene.map((l) => ({ ...l }));
  let line = base.line;
  if (keptOut && id === 'poweroff') {
    line = '당신은 도망쳤다. 도현은 들어가지 않았다. 02:00, 출입 기록에는 채원의 이름이 그대로 남았다.';
    scene = [
      { text: '폰은 다시 켜지지 않았다.' },
      { text: '02:00. 해원고등학교 도서관 3층, 제2서고.' },
      { text: '방문자 #0026 윤채원 — 안에 있음. 방문자 #0027 — 도주' },
      { text: '도현은 새벽 여섯 시까지 정문 앞에 서 있었다. 3층 창문은 끝내 열리지 않았다.' },
      { text: '다음 날 밤, 같은 공중전화 부스. 선반 위에 휴대폰 한 대가 놓여 있다. 채원의 폰이다.' },
      { text: '화면이 켜진다. 배터리 12%.' },
      { text: '방문자 #0028 — 대기' },
      { who: '발신자 정보 없음', text: '들어오세요.', side: 'left' },
    ];
  }
  if (keptOut && id === 'shift') scene[1] = { who: '도현', text: '채원이 정문으로 걸어 나왔어요. 저는 밖에서 기다렸어요. 둘 다 무사해요', side: 'left' };
  if (keptOut && id === 'release') {
    scene[0] = { who: '도현', text: '채원이 나왔어요!!! 정문으로 걸어 나왔어요', side: 'left' };
    scene[1] = { who: '도현', text: '채원이가 그러는데 서랍이 전부 비었대요. 카드가 한 장도 없었대요', side: 'left' };
  }
  // Her name, at last — answering the first thing you said to her.
  if (id === 'release') {
    const i = scene.findIndex((l) => l.text === '서미령이에요.');
    const said = { who: '처음에 누구냐고 물었죠. 서미령이에요.', yes: '서미령이에요. 그 폰, 이제 거기 없어도 돼요.', silent: '서미령이에요. 처음에 대답 안 했죠. 저도 31년 동안 이 말을 못 했어요.' }[choices.c1 ?? ''];
    if (i >= 0 && said) scene[i] = { ...scene[i], text: said };
  }
  // You called 1340 and heard her count. The radio goes on counting — or stops.
  if (flags.includes('heard-radio') && !id.startsWith('s2-')) {
    const radio = {
      poweroff: `새벽 두 시, AM 1340에서 그 목소리가 숫자를 읽었다. “…방문자, ${keptOut ? '공공이팔' : '공공이구'}.”`,
      shift: '그해 겨울, 1340에서 숫자를 읽는 목소리가 바뀌었다. 당신의 목소리였다.',
      release: '그날 이후로 1340에 전화를 걸면, 신호만 가다 끊긴다.',
    }[id as 'poweroff' | 'shift' | 'release'];
    // (in ending 2 it happens before "1년 뒤")
    scene.splice(scene.length - (id === 'shift' ? 2 : 1), 0, { text: radio });
  }
  // You answered her mother as 소연. So the promise she waits on was yours.
  if (id === 's2-daughter' && flags.includes('pretended')) scene[scene.length - 1] = { who: '엄마', text: '소연이가 두 시 전에는 온다고 했어요. 전화로 그랬어요. 목소리가 좀 이상했는데.', side: 'left' };
  // She has your name. Running doesn't take it back.
  if (id === 'poweroff' && flags.includes('gave-name')) {
    scene.splice(scene.length - 1, 1, { text: '그날부터 당신의 휴대폰은 새벽 두 시가 되면 12%에서 멈춘다.' }, { who: '발신자 정보 없음', text: '이름은 적어 뒀어요, {name} 씨. 들어오세요.', side: 'left' });
  }
  return { ...base, line, scene };
}

export function EndingScreen({ id }: { id: EndingId }) {
  // fixed for this showing: the scene plays out on timers
  const def = useMemo(() => endingFor(id, getState().save), [id]);
  const playerName = useGame((s) => s.save.playerName);
  const name = playerName ?? '(이름 없음)';
  // In dialogue, someone who never gave a name is just their number.
  const spoken = playerName ?? '#0027';
  const endings = useGame((s) => s.save.endings);
  const s2 = id.startsWith('s2-');
  // endings found in this season only
  const found = endings.filter((e) => e.startsWith('s2-') === s2).length;
  const bg: ArtSlot | null = s2 ? (id === 's2-daughter' && art('s2-window') ? 's2-window' : (S2_BG[id] ?? null)) : (`ending-${id}` as ArtSlot);
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
  // each new line (and the card at the end) comes into view, like a chat scrolling on its own
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || shown === 0) return;
    const smooth = typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }), 60);
    return () => clearTimeout(t);
  }, [shown, done]);
  return (
    <div ref={box} className={`ending ending-${id}`}>
      {/* the last photograph of the night, behind the words */}
      {bg && art(bg) && <img className="ending-photo" src={art(bg)} alt="" />}
      {/* the true ending's last line comes with the morning: rain stopping over the empty phone booth */}
      {(id === 'release' || id === 's2-home') && <DawnClip on={shown >= def.scene.length} />}
      {/* ending 1 closes where the game opened: the same booth, the same phone lighting up — for someone else */}
      {id === 'poweroff' && <BoothClip on={shown >= def.scene.findIndex((l) => l.text.startsWith('화면이 켜진다')) + 1} />}
      <div className="ending-scene">
        {def.scene.slice(0, shown).map((l, i) =>
          l.who ? (
            <div key={i} className={`ending-bubble ${l.side}`}>
              <small>{l.who}</small>
              <span>{l.text.replaceAll('{name}{이에요}', spoken + copula(spoken)).replaceAll('{name}', spoken)}</span>
            </div>
          ) : (
            <div key={i} className="ending-line-wrap">
              {l.img && art(l.img) && <img className="ending-inline-photo" src={art(l.img)} alt="" draggable={false} />}
              <p className="ending-line">{l.text.replaceAll('{name}', name)}</p>
            </div>
          ),
        )}
      </div>
      {done && (
        <div className="ending-card">
          <small>
            {s2 ? '시즌 2' : '시즌 1'} · 엔딩 {def.n} · 결말 3개 중 {found}개 발견
          </small>
          <h2>{def.title}</h2>
          <p>{def.line}</p>
          {id === 'release' && new Date().getHours() === 2 && <p className="badge-real">★ 진짜 새벽 2시에 기록을 지웠습니다</p>}
          {found < 3 && <p className="ending-more">다른 선택도 있습니다. 결말은 세 가지.</p>}
          {found < 3 && (
            <button type="button" onClick={() => replayFinale() || newGame()}>
              02:00부터 다시 (다른 선택)
            </button>
          )}
          {/* after season 1: the next night, a year later */}
          {!s2 && (
            <button type="button" className={found < 3 ? 'secondary' : undefined} onClick={() => newGame(2)}>
              시즌 2 「귀가」 — 1년 뒤
            </button>
          )}
          <button type="button" className="secondary" onClick={() => newGame()}>
            {s2 ? '시즌 2 처음부터' : '처음부터 다시 하기'}
          </button>
          {s2 && (
            <button type="button" className="secondary" onClick={() => newGame(1)}>
              시즌 1 다시 하기
            </button>
          )}
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

/** The opening clip again: rain on the booth glass, the phone on the shelf lights up — and stays lit. Muted. */
function BoothClip({ on }: { on: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(() => !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    if (on) ref.current?.play().catch(() => setOk(false));
  }, [on]);
  if (!ok) return null;
  return (
    <video
      ref={ref}
      className={`ending-photo ending-clip${on ? ' on' : ''}`}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      onTimeUpdate={(e) => e.currentTarget.currentTime > 3.6 && e.currentTarget.pause()}
    >
      <source src={VIDEO.opening} type="video/mp4" />
      <source src={VIDEO.openingWebm} type="video/webm" onError={() => setOk(false)} />
    </video>
  );
}
