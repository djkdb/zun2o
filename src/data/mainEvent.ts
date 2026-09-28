import type { MainEventStep } from '../game/types';

// The 02:00 sequence, ~30 seconds. Each stage is read by the components that
// care about it (clock, header, navigation, overlay). Times are ms from start.
export const MAIN_EVENT_TIMELINE: MainEventStep[] = [
  { at: 0, stage: 'freeze', sound: 'thud' }, //        clock stops at 02:00:00
  { at: 1800, stage: 'silence' }, //                    room tone cuts out
  { at: 3600, stage: 'fade', sound: 'event' }, //       UI drains, noise rises
  { at: 6200, stage: 'retitle' }, //                    the title rewrites itself
  { at: 9000, stage: 'strip-menu' }, //                 menu items vanish one by one
  { at: 13500, stage: 'dark' }, //                      the page goes out
  { at: 15000, stage: 'record', sound: 'type' }, //     a record types itself
  { at: 19500, stage: 'recall' }, //                    it recalls what you did
  { at: 25500, stage: 'photo', sound: 'anomaly' }, //   the photograph, facing you
  { at: 27400, stage: 'scare', sound: 'scream' }, //    …and then it is not in the photograph
  { at: 29000, stage: 'navigate', sound: 'transition' }, // taken to Record 009
  { at: 31500, stage: 'reveal', sound: 'unlock' }, //   the night archive
  { at: 33500, stage: 'done' },
];

export const MAIN_EVENT_DURATION = 33500;

export const NEW_TITLE = '당신을 보관합니다';

/** Menu items disappear in this order during `strip-menu`. */
export const STRIP_ORDER = ['contact', 'about', 'search', 'records', 'archive'];
export const STRIP_INTERVAL = 800;
