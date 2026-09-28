import type { HorrorLevel, SaveData } from './types';
import { RECORDS } from '../data/records';
import { variantFor } from './horrorEngine';

// ─────────────────────────────────────────────────────────────────────────
// 보관소 검색. 일반 결과는 기록 자체에서 나오고, 숨은 결과는 특정 단어·레벨·
// 행동 조건에서만 나타나는 데이터 행이다. 몇몇은 비밀 경로의 유일한 입구다.
// ─────────────────────────────────────────────────────────────────────────

export interface SearchResult {
  key: string;
  title: string;
  summary: string;
  href?: string;
  corrupted?: boolean;
  /** 이 결과가 표시될 때 세워지는 플래그 (예: 직접 접근 허용). */
  revealsFlag?: string;
}

interface HiddenEntry {
  terms: string[];
  minLevel?: HorrorLevel;
  build: (ctx: SearchContext) => SearchResult | null;
}

export interface SearchContext {
  save: SaveData;
  level: HorrorLevel;
}

const has = (ctx: SearchContext, flag: string) => ctx.save.flags.includes(flag);
const visitor = (ctx: SearchContext) => `방문자 #${String(ctx.save.visitCount).padStart(4, '0')}`;

export const HIDDEN_ENTRIES: HiddenEntry[] = [
  {
    terms: ['02호실', '02호', '2호실', '이호실', '색인실', '방', '호실', 'room', 'room_02', 'room 02', 'room02'],
    minLevel: 2,
    build: () => ({
      key: 'room-02',
      title: 'ROOM_02 (02호실)',
      summary: '[파일 손상] — 38% 복구됨 — 최종 수정 02:00',
      href: '/room-02',
      corrupted: true,
      revealsFlag: 'room02-listed',
    }),
  },
  {
    terms: ['서미령', '미령', '기록사', '그녀', '서', 'varga'],
    minLevel: 3,
    build: (ctx) => ({
      key: 'seo-shift',
      title: '서미령 — 근무 일지',
      summary: '11,540건. 마지막 항목: 오늘 밤.',
      href: has(ctx, 'record-013-indexed') ? '/record/013' : '/record/007',
      corrupted: true,
    }),
  },
  {
    terms: ['013', '13', '일삼', '십삼'],
    build: (ctx) =>
      has(ctx, 'record-013-indexed')
        ? null
        : { key: '013-hint', title: '기록 #013', summary: '색인에 없음. 색인은 방송 순서를 따릅니다.', href: '/record/013' },
  },
  {
    terms: ['017', '17', '근무', '야간 근무', '교대', '미상'],
    build: (ctx) =>
      ctx.save.secretProgress.A.found
        ? { key: '017', title: '기록 017', summary: '대기 중. 02:00에 작성됩니다.', href: '/unknown', corrupted: true }
        : { key: '017-none', title: '기록 017', summary: '그런 기록은 없습니다. 아직은.' },
  },
  {
    terms: ['시스템', '단말기', '직원', '관리자', '로그인', 'system', 'terminal', 'admin'],
    build: (ctx) =>
      has(ctx, 'system-unlocked')
        ? { key: 'system', title: '시스템 접속', summary: '야간 색인 단말기.', href: '/system', corrupted: true }
        : ctx.level >= 3
          ? { key: 'staff', title: '직원 전용', summary: '야간 근무자 전용. 직원 페이지는 그녀의 마지막 문장에 링크되어 있습니다.', href: '/system' }
          : null,
  },
  {
    terms: ['나', '너', '당신', '방문자', '내 이름', '나는'],
    minLevel: 2,
    build: (ctx) => ({ key: 'visitor', title: visitor(ctx), summary: '1건. 오늘 밤 등록됨.', href: '/record/009', corrupted: true }),
  },
  {
    terms: ['0200', '02:00', '2시', '새벽 2시', '두시', '동기화'],
    minLevel: 1,
    build: () => ({ key: 'sync', title: '동기화 일정', summary: '다음 동기화: 02:00:00. 소요 시간: 무기한.' }),
  },
  {
    terms: ['도움말', '도움', '?', 'help'],
    build: () => ({ key: 'help', title: '검색 도움말', summary: '이름, 장소, 숫자로 검색해 보세요. 어떤 기록은 밤에만 나타납니다.' }),
  },
];

export function normalize(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function runSearch(query: string, ctx: SearchContext): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const r of RECORDS) {
    if (r.access === 'hidden' && !has(ctx, 'record-013-indexed')) continue;
    const title = variantFor(r.title, r.titleVariants, ctx.level);
    const haystack = [r.id, title, r.summary, ...r.tags].join(' ').toLowerCase();
    if (!haystack.includes(q) && !q.split(' ').every((t) => haystack.includes(t))) continue;
    const denied = r.access === 'denied' && ctx.level < 5;
    results.push({
      key: r.id,
      title: denied ? `기록 #${r.id} — [접근 거부]` : r.access === 'restricted' ? `기록 #${r.id} — 열람 제한 기록` : `기록 #${r.id} — ${title}`,
      summary: denied ? '이 시간에는 열람할 수 없습니다.' : variantFor(r.summary, r.summaryVariants, ctx.level),
      href: `/record/${r.id}`,
    });
  }

  for (const entry of HIDDEN_ENTRIES) {
    if (entry.minLevel !== undefined && ctx.level < entry.minLevel) continue;
    if (!entry.terms.includes(q)) continue;
    const result = entry.build(ctx);
    if (result && !results.some((r) => r.key === result.key)) results.push(result);
  }
  return results;
}
