import type { SaveData } from './types';
import { formatClock, formatHM, partsOf } from '../utils/time';

export interface TemplateContext {
  save: SaveData;
  now: number;
}

/** 기록/엔딩 텍스트의 {placeholder}를 로컬 저장 데이터로만 치환한다. */
export function fillTemplate(text: string, ctx: TemplateContext): string {
  if (!text.includes('{')) return text;
  const first = new Date(ctx.save.firstVisit);
  const v003 = ctx.save.recordViews['003'] ?? 0;
  const values: Record<string, string> = {
    visitCount: String(ctx.save.visitCount).padStart(4, '0'),
    visitsBefore: String(Math.max(0, ctx.save.visitCount - 1)),
    firstVisitTime: formatHM(first),
    firstVisitDate: first.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    now: formatClock(partsOf(new Date(ctx.now))),
    views003: String(v003),
    clickCount: String(ctx.save.clickCount),
    returnsSentence:
      ctx.save.visitCount <= 1 ? '이번이 첫 방문입니다. 마지막은 아닐 겁니다.' : `그 뒤로 ${ctx.save.visitCount - 1}번 다시 왔습니다.`,
    reportSentence: v003 === 0 ? '그녀에 대한 보고서는 한 번도 열지 않았습니다. 그녀는 당신의 것을 열었습니다.' : `그녀에 대한 보고서를 ${v003}번 열었습니다.`,
  };
  return text.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}
