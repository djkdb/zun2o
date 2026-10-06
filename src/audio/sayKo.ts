// How a line should be *read aloud* in Korean: digits spelled out the way a
// person says them. Used by scripts/voices.mjs for the TTS text and to compare
// a speech-to-text transcript with the line. No imports, so Node can load it.

const SINO = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const HOURS = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];

/** 0–9999 in Sino-Korean (28 → 이십팔, 1994 → 천구백구십사). */
export function sino(n: number): string {
  if (n === 0) return '영';
  let out = '';
  for (const [unit, name] of [
    [1000, '천'],
    [100, '백'],
    [10, '십'],
  ] as const) {
    const d = Math.floor(n / unit) % 10;
    if (d) out += (d === 1 ? '' : SINO[d]) + name;
  }
  return out + SINO[n % 10];
}

/** The text as it is said: "1시 58분" → "한 시 오십팔 분", "3층" → "삼 층", "제2서고" → "제이 서고", "01:13" → "한 시 십삼 분". */
export function sayKo(text: string): string {
  return text
    .replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => `${Number(h) % 12 === 0 ? '열두' : HOURS[Number(h) % 12]} 시${Number(m) ? ` ${sino(Number(m))} 분` : ''}`)
    .replace(/(\d{1,2})\s*시(?![간작])/g, (_, h) => `${Number(h) % 12 === 0 ? '열두' : HOURS[Number(h) % 12]} 시`)
    .replace(/제(\d+)/g, (_, d) => `제${sino(Number(d))} `)
    .replace(/(\d+)\s*(층|월|일|분|년|번|호|명|초)/g, (_, d, u) => `${sino(Number(d))} ${u}`)
    .replace(/\d+/g, (d) => (d.length > 1 && d.startsWith('0') ? [...d].map((c) => (c === '0' ? '공' : SINO[Number(c)])).join('') : sino(Number(d))))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Only the syllables, for comparing what was said with what was meant. */
export function syllables(text: string): string {
  return sayKo(text).replace(/[^가-힣]/g, '');
}

/** Character error rate between the line and a transcript (0 = perfect). */
export function cer(expected: string, heard: string): number {
  const a = syllables(expected);
  const b = syllables(heard);
  if (!a.length) return b.length ? 1 : 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length] / a.length;
}
