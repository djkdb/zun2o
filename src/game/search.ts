import type { HorrorLevel, SaveData } from './types';
import { RECORDS } from '../data/records';
import { variantFor } from './horrorEngine';

// ─────────────────────────────────────────────────────────────────────────
// Archive search. Ordinary results come from the records themselves; hidden
// results are data rows that only surface for certain words, at certain
// levels, or once the visitor has done certain things. Several of them are
// the only way into a secret path.
// ─────────────────────────────────────────────────────────────────────────

export interface SearchResult {
  key: string;
  title: string;
  summary: string;
  href?: string;
  corrupted?: boolean;
  /** Flag set when this result is shown (e.g. unlocks direct access). */
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
const visitor = (ctx: SearchContext) => `VISITOR #${String(ctx.save.visitCount).padStart(4, '0')}`;

export const HIDDEN_ENTRIES: HiddenEntry[] = [
  {
    terms: ['room_02', 'room 02', 'room02', 'room', 'rooms', 'index room'],
    minLevel: 2,
    build: () => ({
      key: 'room-02',
      title: 'ROOM_02',
      summary: '[FILE CORRUPTED] — 38% recovered — last modified 02:00',
      href: '/room-02',
      corrupted: true,
      revealsFlag: 'room02-listed',
    }),
  },
  {
    terms: ['varga', 'ilse', 'archivist', 'i. varga', 'she', 'her'],
    minLevel: 3,
    build: (ctx) => ({
      key: 'varga-shift',
      title: 'VARGA, I. — shift log',
      summary: '11,540 entries. Latest entry: tonight.',
      href: has(ctx, 'record-013-indexed') ? '/record/013' : '/record/007',
      corrupted: true,
    }),
  },
  {
    terms: ['013', '13', 'thirteen', 'one three'],
    build: (ctx) =>
      has(ctx, 'record-013-indexed')
        ? null
        : { key: '013-hint', title: 'RECORD #013', summary: 'Not indexed. The index follows the broadcast order.', href: '/record/013' },
  },
  {
    terms: ['017', '17', 'shift', 'night shift', 'unknown'],
    build: (ctx) =>
      ctx.save.secretProgress.A.found
        ? { key: '017', title: 'RECORD 017', summary: 'Pending. Written at 02:00.', href: '/unknown', corrupted: true }
        : { key: '017-none', title: 'RECORD 017', summary: 'No such record. Yet.' },
  },
  {
    terms: ['system', 'terminal', 'staff', 'access', 'login', 'admin'],
    build: (ctx) =>
      has(ctx, 'system-unlocked')
        ? { key: 'system', title: 'SYSTEM ACCESS', summary: 'Night index terminal.', href: '/system', corrupted: true }
        : ctx.level >= 3
          ? { key: 'staff', title: 'STAFF ONLY', summary: 'Restricted to night staff. Staff are linked from her last sentence.', href: '/system' }
          : null,
  },
  {
    terms: ['me', 'you', 'visitor', 'myself', 'visitors', 'my name'],
    minLevel: 2,
    build: (ctx) => ({ key: 'visitor', title: visitor(ctx), summary: '1 entry. Filed tonight.', href: '/record/009', corrupted: true }),
  },
  {
    terms: ['0200', '02:00', '2am', '2:00', 'two', 'sync'],
    minLevel: 1,
    build: () => ({ key: 'sync', title: 'SYNC SCHEDULE', summary: 'Next sync: 02:00:00. Duration: indefinite.' }),
  },
  {
    terms: ['help', '?'],
    build: () => ({ key: 'help', title: 'Search help', summary: 'Try names, places and numbers. Some records only appear at night.' }),
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
      title: denied ? `Record #${r.id} — [ACCESS DENIED]` : r.access === 'restricted' ? `Record #${r.id} — Restricted record` : `Record #${r.id} — ${title}`,
      summary: denied ? 'Not available at this hour.' : variantFor(r.summary, r.summaryVariants, ctx.level),
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
