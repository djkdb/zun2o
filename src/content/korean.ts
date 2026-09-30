// Small Korean grammar helpers for text that contains the player's name.
/** 이에요 after a final consonant (준호 → 준호예요, 지훈 → 지훈이에요). Digits and Latin read as they sound, roughly. */
export function copula(word: string): string {
  const last = word.at(-1) ?? '';
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? '예요' : '이에요';
  if (/[0-9]/.test(last)) return '1036780'.includes(last) ? '이에요' : '예요';
  return /[bcdgjklmnpqrstvxz]/i.test(last) ? '이에요' : '예요';
}
