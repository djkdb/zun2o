// Which season's story the phone is running. Content modules read this to
// hand out the right threads, photos, records and beats; the save decides it
// (engine/state keeps it in sync), so a reload lands in the same season.

export type SeasonId = 1 | 2;

let current: SeasonId = 1;

export const seasonOf = (): SeasonId => current;
export const isS2 = (): boolean => current === 2;
export function syncSeason(n: SeasonId | undefined): void {
  current = n ?? 1;
}
/** The season-1 value, or the season-2 one. */
export const pick = <T,>(s1: T, s2: T): T => (current === 2 ? s2 : s1);
