// The game's story, as a folder of markdown the writing skills in .claude/skills can read
// (the fiction-skills / story-skills layout): contract, characters, outline, one file per beat, refs.
//
//   npm run story:export        → story/   (generated; not committed — run it again after edits)
//
// Source of truth stays in src/content; this is a read-only view for reviewers.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { BEATS } from '../src/content/script.ts';
import { BEATS_S2 } from '../src/content/s2/script.ts';
import { CALLS, VIDEO_CALL_LINES } from '../src/content/calls.ts';
import { THREAD_META, INITIAL_THREADS } from '../src/content/threads.ts';
import { THREAD_META_S2, INITIAL_THREADS_S2 } from '../src/content/s2/threads.ts';
import { PHOTOS, NOTES, MEMO_M1 } from '../src/content/media.ts';
import { PHOTOS_S2, NOTES_S2, NOTEBOOK, MEMO_S2M1, MEMO_S2M2, MEMO_S2TAPE } from '../src/content/s2/media.ts';
import { ARCHIVE } from '../src/content/archive.ts';
import { ARCHIVE_S2 } from '../src/content/s2/archive.ts';

const OUT = 'story';
rmSync(OUT, { recursive: true, force: true });
for (const d of ['02_characters', '05_scenes', 'refs', 'notes']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const write = (p, s) => writeFileSync(`${OUT}/${p}`, s.trimEnd() + '\n');
const sec = (ms) => `${(ms / 1000).toFixed(ms % 1000 ? 1 : 0)}s`;

// 나에게: season 1 is 채원 writing from inside, season 2 is 소연
const who = (th, from, meta) => (from === 'me' ? (th === 'self' ? `나에게(${meta.__self} — 안에서 보냄)` : '플레이어') : (meta[th]?.name ?? th));

/** One action as a line a reader can follow. */
function line(a, meta) {
  switch (a.t) {
    case 'msg':
      return `- **[${who(a.th, a.from, meta)}]** ${a.text}${a.typing ? `  _(입력 중 ${sec(a.typing)})_` : ''}${a.attach ? `  📎 ${a.attach.kind}${a.attach.id ? ` ${a.attach.id}` : ''}` : ''}`;
    case 'wait':
      return `- ⏱ ${sec(a.ms)}`;
    case 'choice':
      return `- ❓ 선택지 \`${a.id}\` (${meta[a.th]?.name ?? a.th}): ${a.options.map((o) => `[${o.id}] ${o.label}`).join(' / ')}`;
    case 'unchoice':
      return `- ⌛ 선택지 \`${a.id}\` 시간 초과로 사라짐`;
    case 'typing':
      return `- … ${meta[a.th]?.name ?? a.th} 입력 중 ${sec(a.ms)} — 아무것도 안 옴`;
    case 'unsend':
      return `- 🗑 ${meta[a.th]?.name ?? a.th}: "${a.match}…" 메시지 삭제`;
    case 'draft':
      return `- ✎ 답장칸에 저절로 쳐짐: "${a.text}"`;
    case 'call':
      return `- 📞 전화: \`${a.id}\` (refs/calls.md)`;
    case 'notify':
      return `- 🔔 알림 [${a.title}] ${a.body}`;
    case 'objective':
      return `- 🎯 목표: ${a.text}  _(힌트: ${a.hint})_`;
    case 'chapter':
      return `- 📖 **${a.n}장 「${a.title}」**`;
    case 'time':
      return `- 🕐 ${a.hm}${a.lost ? ' (시간을 잃음)' : ''}`;
    case 'scare':
      return `- 😱 스케어: ${a.kind}${a.look ? ` (${a.look})` : ''}`;
    case 'sound':
      return `- 🔊 ${a.id}${a.caption ? ` — 무음일 때: "${a.caption}"` : ''}`;
    case 'hush':
      return `- 🤫 정적 ${sec(a.ms)}${a.still ? ' (예고 없이)' : ''}`;
    case 'write':
      return `- ✍ 메모 앱에 남의 손이 씀: "${a.text.replace(/\b/g, '⌫')}"`;
    case 'photo':
    case 'memo':
    case 'note':
      return `- ➕ 새 ${a.t}: \`${a.id}\``;
    case 'flag':
      return `- 🏳 flag \`${a.f}\``;
    case 'emit':
      return `- → 이벤트 \`${a.ev}\``;
    default:
      return `- ⚙ ${a.t}${Object.entries(a).filter(([k]) => k !== 't').map(([k, v]) => ` ${k}=${JSON.stringify(v)}`).join('')}`;
  }
}

function scenes(beats, meta, season) {
  const outline = [`## 시즌 ${season}`, ''];
  beats.forEach((b, i) => {
    const n = String(i + 1).padStart(3, '0');
    const file = `05_scenes/s${season}-${n}-${b.id}.md`;
    const cond = [b.requires?.length ? `requires: ${b.requires.join(', ')}` : '', b.forbids?.length ? `forbids: ${b.forbids.join(', ')}` : '', b.repeat ? 'repeat' : ''].filter(Boolean).join(' · ');
    write(file, `# s${season}-${n} \`${b.id}\`\n\n- 발동: \`${b.on}\`${cond ? `\n- 조건: ${cond}` : ''}\n\n${b.actions.map((a) => line(a, meta)).join('\n')}`);
    const first = b.actions.find((a) => a.t === 'msg' || a.t === 'chapter' || a.t === 'call');
    outline.push(`- [s${season}-${n} ${b.id}](${file}) — on \`${b.on}\`${first ? `: ${first.t === 'msg' ? first.text : first.t === 'chapter' ? `${first.n}장 ${first.title}` : `전화 ${first.id}`}` : ''}`);
  });
  return outline.join('\n');
}

// ── contract ─────────────────────────────────────────────────────────────
write(
  '00_contract.md',
  `# Story Contract — 「12%」

- **매체:** 주운 아이폰 화면이 곧 게임인 한국어 공포 웹게임(PWA). 메시지·통화·사진·메모·녹음·인터넷(심야 기록보관소)으로 이야기를 겪는다. 시즌당 약 15분, 실시간 진행(이벤트·타이머).
- **장르:** 한국형 오컬트 공포 + 가족 비극. 깜짝 놀람보다 기다리게 만드는 공포. 괴물이 피해자이고, 답은 괴물의 이름.
- **시즌 1:** 채원의 폰. 23:51 → 02:00. 1994년 사라진 사서 서미령이 "이름을 적는 사람"이 되어 있다. 02:00에 안에 있으면 한 명이 적힌다.
- **시즌 2:** 1년 뒤 소연(서미령의 딸, 43)의 폰. 돌아온 엄마(41 그대로)가 매달 28일 01:59에 잠든 채 노트에 이름을 쓴다.
- **어조 규칙:** 설명하지 않는다. 과장·번역투·장르 클리셰("이름을 적을 시간이에요" 류) 금지. 귀신은 보고 있다고 말하지 않고, 본 사람만 아는 것을 말한다. 같은 수법은 한 번만.
- **지킬 것:** 퍼즐 정답(0113, 1340, 001→003→007, HAEWON-0200, 서미령 / 0314, 0928, "엄마가 두 시 전에는 온다고 했어요")과 엔딩 6개는 유지. 카메라·마이크·위치 연출 금지. 소리 없이도(자막) 전부 전달. 녹음된 대사 55줄(docs/VOICE_LINES.md)은 바꾸면 재녹음.
- **이전 검토:** docs/story-room/0-showrunner.md (무엇을 왜 바꿨나), 1~5 보고서, docs/STORY_AUDIT.md, docs/PERSONA_SIM.md.
- **원본:** src/content/*.ts, src/content/s2/*.ts, src/phone/Finale*.tsx, src/phone/Ending.tsx. 이 폴더는 \`npm run story:export\`로 만든 읽기 전용 사본.
`,
);

// ── characters: every line each one says, in play order ─────────────────
const CAST = {
  '서미령 (발신자 정보 없음, 시즌 1)': (th, from, s) => s === 1 && th === 'unknown' && from !== 'me',
  '채원': (th, from, s) => (s === 1 && th === 'self') || (s === 2 && th === 'chaewon'),
  '도현': (th, from, s) => s === 1 && th === 'dohyun',
  '채원 엄마 (시즌 1)': (th, from, s) => s === 1 && th === 'mom',
  '기록 (발신자 정보 없음, 시즌 2)': (th, from, s) => s === 2 && th === 'unknown' && from !== 'me',
  '엄마 서미령 (시즌 2)': (th, from, s) => s === 2 && th === 'mom',
  '소연 (시즌 2)': (th, from, s) => s === 2 && th === 'self',
};
const idx = ['# 인물', '', '말투 카드는 docs/story-room/3-actor.md. 아래 파일은 장면 스크립트에서 각 인물이 보내는 문자를 재생 순서대로 모은 것(통화 대사는 refs/calls.md).', ''];
Object.entries(CAST).forEach(([name, test], i) => {
  const said = [];
  for (const [beats, s] of [[BEATS, 1], [BEATS_S2, 2]])
    for (const b of beats) for (const a of b.actions) if (a.t === 'msg' && test(a.th, a.from, s)) said.push(`- \`${b.id}\` ${a.text}`);
  const file = `02_characters/${String(i + 1).padStart(2, '0')}.md`;
  write(file, `# ${name}\n\n${said.join('\n') || '(장면 스크립트의 문자 없음 — 통화·녹음·대화 기록 참고)'}`);
  idx.push(`- [${name}](${file.replace('02_characters/', '')}) — 문자 ${said.length}개`);
});
write('02_characters/index.md', idx.join('\n'));

// ── outline + scenes ─────────────────────────────────────────────────────
write(
  '03_outline.md',
  `# 개요 — 장면(beat) 순서\n\n각 줄은 이벤트가 일어나면 한 번 실행되는 장면입니다(조건은 장면 파일에). 실제 재생 순서는 이벤트에 따라 갈립니다.\n\n${scenes(BEATS, { ...THREAD_META, __self: '채원' }, 1)}\n\n${scenes(BEATS_S2, { ...THREAD_META, ...THREAD_META_S2, __self: '소연' }, 2)}`,
);

// ── refs ─────────────────────────────────────────────────────────────────
const callMd = (calls) =>
  Object.values(calls)
    .map((c) => `## \`${c.id}\` — ${c.label}\n\n${[...c.lines, ...(c.after ?? [])].map((l) => `- ${sec(l.at)} **${l.who}** ${l.text}`).join('\n')}${c.choice ? `\n\n선택지: ${c.choice.options.map((o) => o.label).join(' / ')}` : ''}${c.afterBy ? `\n\n선택별 뒷부분:\n${Object.entries(c.afterBy).map(([k, ls]) => `- [${k}] ${ls.map((l) => l.text).join(' / ')}`).join('\n')}` : ''}`)
    .join('\n\n');
write('refs/calls.md', `# 통화 대본\n\n${callMd(CALLS)}\n\n## 02:00 영상통화 (채원)\n\n${VIDEO_CALL_LINES.map((t) => `- ${t}`).join('\n')}`);
const threadsMd = (threads, meta) =>
  Object.entries(threads)
    .map(([th, ms]) => `## ${meta[th]?.name ?? th}\n\n${ms.map((m) => `- ${m.time ?? ''} ${m.from === 'me' ? '▶' : '◀'} ${m.text}`).join('\n')}`)
    .join('\n\n');
write('refs/threads-s1.md', `# 시즌 1 — 시작할 때 이미 있는 대화 기록\n\n${threadsMd(INITIAL_THREADS, THREAD_META)}`);
write('refs/threads-s2.md', `# 시즌 2 — 시작할 때 이미 있는 대화 기록\n\n${threadsMd(INITIAL_THREADS_S2, { ...THREAD_META, ...THREAD_META_S2 })}`);
const dump = (title, o) => `# ${title}\n\n\`\`\`json\n${JSON.stringify(o, null, 2)}\n\`\`\``;
write('refs/media-s1.md', dump('시즌 1 — 사진·메모·녹음', { PHOTOS, NOTES, MEMO_M1 }));
write('refs/media-s2.md', dump('시즌 2 — 사진·메모·녹음·노트', { PHOTOS_S2, NOTES_S2, NOTEBOOK, MEMO_S2M1, MEMO_S2M2, MEMO_S2TAPE }));
write('refs/archive-s1.md', dump('시즌 1 — 심야 기록보관소 문서', ARCHIVE));
write('refs/archive-s2.md', dump('시즌 2 — 심야 기록보관소 문서', ARCHIVE_S2));
// 02:00 and the endings live in components: copied as they are
for (const f of ['Finale.tsx', 'Finale2.tsx', 'Ending.tsx', 'ColdOpen.tsx']) copyFileSync(`src/phone/${f}`, `${OUT}/refs/${f}.txt`);
write('refs/README.md', '# refs\n\n02:00 화면과 엔딩, 콜드 오픈은 컴포넌트에 들어 있어 원본을 그대로 복사했습니다(`*.tsx.txt`). 대사는 문자열을 읽으면 됩니다. 엔딩 대사는 Ending.tsx의 ENDINGS와 endingFor().');
write('open-questions.md', '# Open questions\n');
write('notes/README.md', '# notes\n');
console.log(`story/ ← ${BEATS.length + BEATS_S2.length} scenes, ${Object.keys(CAST).length} characters`);
