import type { EndingDef } from '../game/types';

// Ending conditions are data. endingManager.ts evaluates `requires`.
export const ENDINGS: EndingDef[] = [
  {
    id: 'normal',
    index: 1,
    title: 'CHECKED OUT',
    subtitle: 'You left before the index could finish.',
    trigger: 'leave',
    requires: {},
    lines: [
      'Your visitor card has been returned to the index.',
      'The reading-room lamp has been switched off.',
      'The archive thanks you for your visit.',
      'Please come again tomorrow night.',
      'You left before two. Most people do.',
    ],
  },
  {
    id: 'secret',
    index: 2,
    title: 'THE INDEX',
    subtitle: 'The continuation has been accepted.',
    trigger: 'terminal-key',
    requires: { secrets: ['A', 'B'] },
    lines: [
      'CONTINUATION ACCEPTED.',
      'RECORD 017 has been assigned.',
      'Name: VISITOR #{visitCount}. Filed by: the night index.',
      'Every night at 02:00 the index will add one line about you.',
      'It already knows when you arrive. It already knows what you read.',
      'There is one more thing it will only show you at 02:00.',
    ],
  },
  {
    id: 'true',
    index: 3,
    title: 'NIGHT SHIFT',
    subtitle: 'Somebody has to stay until they come.',
    trigger: 'accept-shift',
    requires: { secrets: ['A', 'B', 'C'], phase: ['after'] },
    lines: [
      'Shift accepted at {now}.',
      'RECORD 003 — VARGA, I. — status changed: RELIEVED.',
      'She put on her coat. She did not look at the doorway.',
      'The lamp is yours now. The drawers are yours. The visitors are yours.',
      'Somebody will open this site tomorrow night at 01:58.',
      'Be kind to them. Keep the log.',
      'RECORD 017 — VISITOR #{visitCount} — status: MISSING.',
    ],
  },
];

export const ENDING_BY_ID = Object.fromEntries(ENDINGS.map((e) => [e.id, e])) as Record<EndingDef['id'], EndingDef>;
