import { describe, expect, it } from 'vitest';
import { cer, sayKo, sino, syllables } from './sayKo';

describe('sayKo — lines read the way a person says them', () => {
  it('spells out numbers', () => {
    expect(sino(28)).toBe('이십팔');
    expect(sino(1994)).toBe('천구백구십사');
    expect(sino(10)).toBe('십');
  });
  it('reads the clock, floors and dates in the voiced lines', () => {
    expect(sayKo('8월 28일. 1시 58분. 엄마가 또 일어났어.')).toBe('팔 월 이십팔 일. 한 시 오십팔 분. 엄마가 또 일어났어.');
    expect(sayKo('지금 3층이고요.')).toBe('지금 삼 층이고요.');
    expect(sayKo('들려요? 저 제2서고 안이에요.')).toBe('들려요? 저 제이 서고 안이에요.');
    expect(sayKo('01:13에 시작했어요')).toBe('한 시 십삼 분에 시작했어요');
    expect(sayKo('두 시 전에는 와.')).toBe('두 시 전에는 와.');
  });
  it('compares a transcript with the line, digits or not', () => {
    expect(cer('지금 3층이고요.', '지금 삼층이고요')).toBe(0);
    expect(cer('먼저 자. 엄마 두 시 전에는 와.', '먼저 자 엄마 두시 전에는 와')).toBe(0);
    expect(cer('도현아', '도현')).toBeCloseTo(1 / 3);
    expect(syllables('whispers 들려요?')).toBe('들려요');
  });
});
