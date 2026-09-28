import type { SaveData } from './types';
import { formatClock, formatHM, partsOf } from '../utils/time';

export interface TemplateContext {
  save: SaveData;
  now: number;
}

/** Resolve {placeholders} in record / ending text from local save data only. */
export function fillTemplate(text: string, ctx: TemplateContext): string {
  if (!text.includes('{')) return text;
  const first = new Date(ctx.save.firstVisit);
  const values: Record<string, string> = {
    visitCount: String(ctx.save.visitCount).padStart(4, '0'),
    visitsBefore: String(Math.max(0, ctx.save.visitCount - 1)),
    firstVisitTime: formatHM(first),
    firstVisitDate: first.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    now: formatClock(partsOf(new Date(ctx.now))),
    views003: String(ctx.save.recordViews['003'] ?? 0),
    clickCount: String(ctx.save.clickCount),
    returnsSentence:
      ctx.save.visitCount <= 1
        ? 'This is your first visit. It will not be your last.'
        : `You came back ${ctx.save.visitCount - 1} ${ctx.save.visitCount === 2 ? 'time' : 'times'}.`,
    reportSentence: (() => {
      const v = ctx.save.recordViews['003'] ?? 0;
      return v === 0 ? 'You never opened the report on her. She opened yours.' : `You opened the report on her ${v} ${v === 1 ? 'time' : 'times'}.`;
    })(),
  };
  return text.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}
