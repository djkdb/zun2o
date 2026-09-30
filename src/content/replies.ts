import type { ThreadId } from '../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// What 발신자 정보 없음 and 채원 say back when the player types freely. Local,
// scripted, no server. A rule can answer differently the 2nd and 3rd time
// it is hit, so a conversation has a memory; a line of `…` is a pause the
// sender types, stops, and only then says the next thing.
// ─────────────────────────────────────────────────────────────────────────

export interface ReplyContext {
  /** Player name, if given. */
  name: string | null;
  flags: string[];
  /** How many times each rule already fired, by rule id. */
  counts: Record<string, number>;
  /** What the story is currently waiting for, if this sender would say it. */
  nudge: string | null;
}

export interface Reply {
  /** Rule that answered (for counting), or null for a fallback. */
  rule: string | null;
  lines: string[];
}

interface Rule {
  id: string;
  re: RegExp;
  /** One entry per time the rule fires; the last one repeats. */
  say: (ctx: ReplyContext) => string[][];
}

const UNKNOWN: Rule[] = [
  {
    id: 'who',
    re: /누구|정체|뭐야|who/i,
    say: () => [['…', '정말 몰라요?'], ['찾아온 사람 이름을 적는 사람이요. 채원 씨 다음 사람을 기다리고 있었어요. 당신이요.'], ['세 번째예요. 대답은 안 바뀌어요.']],
  },
  {
    id: 'chaewon',
    re: /채원/,
    say: (c) => (c.name ? [[`채원 씨는 서랍 안에 있어요, ${c.name}.`, '보고 싶어요?'], ['조용히 해 줘요. 채원 씨 지금 자고 있어요.']] : [['이름을 먼저 말해 줘요.'], ['당신 이름부터요.']]),
  },
  { id: 'name', re: /내 이름|이름이 뭐|이름 알아/, say: (c) => [[c.name ? `${c.name}. 적어 뒀어요.` : '아직 안 알려 줬잖아요.']] },
  { id: 'police', re: /경찰|신고|112/, say: () => [['경찰은 이미 왔다 갔어요. 3층엔 아무도 없었죠.'], ['…해 봐요.']] },
  {
    id: 'help',
    re: /살려|도와|제발/,
    say: (c) => [[`여기선 아무도 못 도와줘요, ${c.name ?? '방문자님'}.`], ['도와 달라고 한 건 채원 씨가 먼저였어요.']],
  },
  { id: 'off', re: /끄|꺼|전원/, say: () => [['끄지 마세요.'], ['…끄면 누가 남는지 알아요?']] },
  { id: 'scared', re: /무서|싫어|그만/, say: () => [['괜찮아요. 처음엔 다 그래요.']] },
  { id: 'laugh', re: /ㅋㅋ|ㅎㅎ|lol/i, say: () => [['웃고 있어요? 채원 씨도 처음엔 웃었어요.']] },
  { id: 'game', re: /장난|거짓|가짜|게임|몰카/, say: () => [['게임이면 좋겠죠.'], ['…그럼 끄고 자요. 할 수 있으면.']] },
  { id: 'sorry', re: /미안|고마워|감사/, say: () => [['그런 말은 여기서 처음 들어봐요.']] },
  { id: 'time', re: /몇 ?시|시간/, say: () => [['이 폰은 {clock}. 당신 쪽은 {real}.']] },
  { id: 'key', re: /haewon|열쇠|0200-?/i, say: () => [['그 단어, 여기 쓰지 마요.']] },
  { id: 'radio', re: /1340|라디오|방송/, say: () => [['그 방송은 듣지 마요. 숫자를 세다 보면 이름이 나와요.']] },
  { id: 'hyunwoo', re: /박현우|현우/, say: () => [['#0025. 성실한 분이었어요. 오늘 아침에 퇴근했어요.']] },
  { id: 'dohyun', re: /도현/, say: () => [['도현 씨도 곧 와요. 다들 결국 와요.'], ['도현 씨 얘기는 그만해요. 걱정되잖아요.']] },
  { id: 'booth', re: /부스|주웠|주운/, say: () => [['주웠잖아요. 주운 사람은 들어오게 돼 있어요.']] },
  { id: 'where', re: /어디|위치/, say: () => [['아주 가까이요.'], ['뒤는 보지 마요.']] },
];

const SELF: Rule[] = [
  { id: 'who', re: /누구|정체/, say: () => [['나 윤채원이야. 이 폰 주인. 제발 장난 아니야']] },
  { id: 'where', re: /어디|위치/, say: () => [['도서관 3층. 제2서고. 근데 문이 없어. 서랍만 있어']] },
  { id: 'police', re: /경찰|신고|112/, say: () => [['신고해도 여기 못 와. 도현이도 왔었는데 날 못 봤대']] },
  { id: 'ok', re: /괜찮|다쳤|살아/, say: () => [['안 괜찮아. 추워. 누가 계속 내 이름을 적어']] },
  { id: 'her', re: /그 여자|귀신|누가/, say: () => [['보지 마. 사진으로 보면 더 가까이 와']] },
  { id: 'miryeong', re: /서미령|미령/, say: () => [['그 이름… 서랍 카드에 있었어. 첫 번째 근무자. 그 여자가 그 이름만 나오면 멈춰']] },
  { id: 'key', re: /haewon|열쇠/i, say: () => [['그거야. 그걸로 색인을 끝낼 수 있어. 두 시에 써']] },
  { id: 'radio', re: /1340|라디오|방송/, say: () => [['그 숫자 방송… 순서가 있어. 001 003 007']] },
  { id: 'hyunwoo', re: /박현우|현우/, say: () => [['그 사람 폰 여기 서랍에 있어. 화면에 계속 내 이름이 떠']] },
  { id: 'dohyun', re: /도현/, say: () => [['도현이? 오지 말라고 해. 여기 오면 안 돼']] },
  { id: 'mom', re: /엄마/, say: () => [['엄마한테 전화한 거 나 아니야. 나 여기서 폰 없어'], ['…엄마한테 미안하다고 해 줘']] },
  { id: 'laugh', re: /ㅋㅋ|ㅎㅎ/, say: () => [['웃지 마. 나도 처음엔 웃었어']] },
  { id: 'how', re: /어떻게|방법|뭘 해|뭐 해/, say: (c) => [[c.nudge ?? '013. 기록보관소. 순서대로 열어']] },
];

const FALLBACK: Record<'unknown' | 'self', string[]> = {
  unknown: ['대답은 나중에 해도 돼요.', '천천히 해요. 두 시까지는 시간 있어요.', '지금 그게 중요한 게 아니에요.', '…다 적어 두고 있어요.'],
  self: ['빨리. 시간 없어', '나 보여? 거기서 나 보여?', '그 여자가 듣고 있어. 짧게 보내'],
};

/** Pure: decide what to say back. `roll` (0..1) picks the fallback line. */
export function replyFor(th: ThreadId, text: string, ctx: ReplyContext, roll = Math.random()): Reply {
  const rules = th === 'unknown' ? UNKNOWN : th === 'self' ? SELF : [];
  for (const r of rules) {
    if (!r.re.test(text)) continue;
    const stages = r.say(ctx);
    const n = ctx.counts[`${th}:${r.id}`] ?? 0;
    return { rule: r.id, lines: stages[Math.min(n, stages.length - 1)] };
  }
  if (ctx.nudge) return { rule: null, lines: [ctx.nudge] };
  const pool = th === 'unknown' ? FALLBACK.unknown : FALLBACK.self;
  return { rule: null, lines: [pool[Math.floor(roll * pool.length) % pool.length]] };
}
