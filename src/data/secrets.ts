import type { SecretDef } from '../game/types';

export const SECRETS: SecretDef[] = [
  {
    id: 'A',
    name: 'The Broadcast Order',
    hint: 'The radio read four numbers.',
    description: 'Open Records 001 → 003 → 007 in the order the voice read them, then open Record 013.',
  },
  {
    id: 'B',
    name: 'Her Last Sentence',
    hint: 'She pressed harder on the last line.',
    description: 'Click the final sentence in Record 003, then open the unknown file in the staff terminal.',
  },
  {
    id: 'C',
    name: 'The Visitor Log',
    hint: 'Record 009 is not available at this hour.',
    description: 'Open Record 009 between 02:00 and 02:59.',
  },
  {
    id: 'D',
    name: 'The Room That Was Not Transferred',
    hint: 'There is no ROOM_02 file in this archive.',
    description: 'Search for the file the archive says does not exist, while the archive is uneasy.',
  },
];

export const SECRET_BY_ID = Object.fromEntries(SECRETS.map((s) => [s.id, s])) as Record<SecretDef['id'], SecretDef>;
