import type { ArchiveRecord } from '../game/types';

// ─────────────────────────────────────────────────────────────────────────
// The archive's records. Text supports placeholders resolved at render time
// (see game/template.ts): {visitCount} {firstVisitTime} {firstVisitDate}
// {now} {views003} {clickCount} {visitsBefore} {returnsSentence} {reportSentence}
// `variants` swap text by horror level (highest key ≤ current level wins).
// Blocks marked `anomalyTarget` may be disturbed by record-body anomalies.
// ─────────────────────────────────────────────────────────────────────────

export const RECORDS: ArchiveRecord[] = [
  {
    id: '001',
    title: 'KVHN Overnight Broadcast Log',
    date: '1994-03-15',
    classification: 'Broadcast / Transcribed',
    access: 'public',
    summary: "Operator's log from KVHN-AM covering the week of the Annex incident.",
    tags: ['radio', 'broadcast', 'kvhn', 'numbers', '02:00', 'signal'],
    blocks: [
      {
        type: 'p',
        text: "The following entries were transcribed from the overnight operator's log of KVHN-AM (1340 kHz), a small station eleven kilometres north of the Harrow Municipal Annex. The original log book was donated to the archive in 1997.",
      },
      {
        type: 'table',
        rows: [
          ['01:12', 'Signal nominal. Weather band.'],
          ['01:40', 'Listener call re: interference on 1340. Could not reproduce.'],
          ['01:58', 'Carrier drop. Restored manually.'],
          ['02:00', 'Dead air, 61 seconds. Faint voice under carrier (female?) reading numbers.'],
          ['02:01', 'Normal programming resumed.'],
        ],
        variants: {
          3: [
            ['01:12', 'Signal nominal. Weather band.'],
            ['01:40', 'Listener call re: interference on 1340. Could not reproduce.'],
            ['01:58', 'Carrier drop. Restored manually.'],
            ['02:00', 'Dead air, 61 seconds. Voice under carrier reading numbers. Closer than last night.'],
            ['02:01', 'Normal programming resumed.'],
          ],
          5: [
            ['01:12', 'Signal nominal. Weather band.'],
            ['01:58', 'Carrier drop.'],
            ['02:00', 'Dead air. The voice is reading visitor numbers now.'],
            ['02:00', 'VISITOR #{visitCount}.'],
            ['02:01', '—'],
          ],
        },
      },
      { type: 'h', text: "Operator's note" },
      {
        type: 'p',
        text: 'Numbers heard, as best I could make out: zero zero one. Zero zero three. Zero zero seven. One three. Then something that was not a number. Same on the 16th. Same on the 17th. The chief engineer says it is skip from another station. There is no other station.',
        variants: {
          2: 'Numbers heard, as best I could make out: zero zero one. Zero zero three. Zero zero seven. One three. Then something that was not a number. Same on the 16th. Same on the 17th. I have started leaving the booth before two.',
        },
      },
      { type: 'photo', scene: 'tower', caption: 'KVHN transmitter mast, photographed by a volunteer, 1997.' },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The log continues until 29 March, after which KVHN changed its overnight schedule to a pre-recorded loop. No explanation was recorded.',
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '002',
    title: 'Harrow County Weather Survey, March 1994',
    date: '1994-03-14',
    classification: 'Survey / Hourly readings',
    access: 'public',
    summary: "Hourly temperature readings, including the Annex's rooftop station.",
    tags: ['weather', 'temperature', 'survey', 'clock', 'annex'],
    blocks: [
      {
        type: 'p',
        text: 'Volunteer observers submitted hourly readings to the county office throughout March 1994. The Annex rooftop station was maintained by building staff on the night shift.',
      },
      {
        type: 'table',
        rows: [
          ['01:00', '4.1 °C'],
          ['01:30', '3.9 °C'],
          ['01:45', '3.8 °C'],
          ['01:55', '3.8 °C'],
          ['01:59', '3.8 °C'],
          ['02:00', '−11.0 °C (instrument error?)'],
          ['02:01', '3.7 °C'],
        ],
      },
      {
        type: 'p',
        text: "An annotation in pencil beside the 02:00 reading: 'Again. Every clock in the building stopped at the same minute. I.V. says she heard the index drawers.'",
      },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The station was decommissioned with the building in 1995.',
        variants: { 3: 'The station was decommissioned with the building in 1995. It still reports.' },
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '003',
    title: 'Missing Person Report: I. Varga',
    date: '1994-03-14',
    classification: 'Case file / Public copy',
    access: 'public',
    summary: 'Night archivist at the Harrow Annex. Last seen at the reading-room desk.',
    summaryVariants: { 3: 'Night archivist at the Harrow Annex. Last seen at the reading-room desk. Last seen?' },
    tags: ['missing', 'varga', 'ilse', 'archivist', 'reading room', 'photo', 'index'],
    blocks: [
      {
        type: 'table',
        rows: [
          ['Name', 'Ilse Varga'],
          ['Age', '41'],
          ['Occupation', 'Night archivist, Harrow Municipal Annex'],
          ['Last seen', '14 March 1994, approx. 01:50, reading room'],
          ['Status', 'Missing'],
        ],
        variants: {
          5: [
            ['Name', 'Ilse Varga'],
            ['Age', '41'],
            ['Occupation', 'Night archivist'],
            ['Last seen', 'Tonight, 02:00, reading room'],
            ['Status', 'On shift'],
          ],
        },
      },
      {
        type: 'p',
        text: 'Ms. Varga worked the overnight inventory shift alone, as she had for nine years. The day clerk arrived at 07:30 on 14 March to find the reading-room lamp on, the index drawer open, and her coat on the chair. Her car remained in the lot.',
      },
      {
        type: 'photo',
        scene: 'reading-room',
        caption: 'Reading room, photographed by police at 07:45. Nothing appears disturbed.',
        captionVariants: {
          2: 'Reading room, photographed by police at 07:45. One officer later asked who had been standing in the doorway.',
          5: 'Reading room, photographed at 02:00.',
        },
      },
      {
        type: 'p',
        text: 'Her final inventory sheet was recovered from the desk. The last line is written more heavily than the others:',
      },
      { type: 'secret-sentence', before: '“', text: 'The index is longer at night.', after: '”' },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'Investigators noted that the reading-room clock had stopped at 02:00. The case remains open. The archive keeps this record public at the family’s request.',
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '004',
    title: 'Transfer Inventory, Box 44',
    date: '1996-06-02',
    classification: 'Inventory',
    access: 'public',
    summary: 'Items moved from the Annex reading room to the archive.',
    tags: ['inventory', 'box', 'lamp', 'clock', 'photograph', 'drawer'],
    blocks: [
      {
        type: 'p',
        text: 'Box 44 was the last box removed from the Annex before it was sealed. Inventory taken by two volunteers.',
      },
      {
        type: 'table',
        rows: [
          ['Item 1', 'Index card drawer, oak, 1 of 3 (drawers 2–3 missing)'],
          ['Item 2', 'Desk lamp, green shade, bulb working'],
          ['Item 3', 'Inventory sheets, 14 March 1994'],
          ['Item 4', 'Photograph, reading room — subjects: 0'],
          ['Item 5', 'Wall clock (stopped, 02:00)'],
          ['Item 6', 'Coat, wool, grey'],
        ],
        variants: {
          2: [
            ['Item 1', 'Index card drawer, oak, 1 of 3 (drawers 2–3 missing)'],
            ['Item 2', 'Desk lamp, green shade, bulb working'],
            ['Item 3', 'Inventory sheets, 14 March 1994'],
            ['Item 4', 'Photograph, reading room — subjects: 1'],
            ['Item 5', 'Wall clock (stopped, 02:00)'],
            ['Item 6', 'Coat, wool, grey'],
          ],
          4: [
            ['Item 1', 'Index card drawer, oak, 1 of 3 (drawers 2–3 missing)'],
            ['Item 2', 'Desk lamp, green shade, bulb working'],
            ['Item 3', 'Inventory sheets, 14 March 1994'],
            ['Item 4', 'Photograph, reading room — subjects: 1 (facing camera)'],
            ['Item 5', 'Wall clock (running)'],
            ['Item 6', 'Coat, wool, grey'],
            ['Item 7', 'Visitor card, #{visitCount} (not added by staff)'],
          ],
        },
      },
      {
        type: 'p',
        text: 'Note from the second volunteer: the drawer contains more index cards than it can physically hold. We counted twice. We stopped counting after 02:00.',
      },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The lamp was tested at the archive and still works.',
        variants: { 3: 'The lamp was tested at the archive and still works. Nobody has switched it on since. It is on.' },
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '005',
    title: 'Harrow Municipal Annex (Closed)',
    date: '1995-11-30',
    classification: 'Property / Closure',
    access: 'public',
    summary: 'The building that held the records until it was sealed in 1995.',
    tags: ['annex', 'building', 'closed', 'floor plan', 'room', 'room 01', 'room 02', 'sealed'],
    blocks: [
      {
        type: 'p',
        text: "The Annex, built in 1961, housed county deeds, court transcripts and the night index. It was closed in November 1995 following 'repeated electrical faults occurring at or around 02:00'. The building still stands.",
      },
      { type: 'photo', scene: 'annex', caption: 'Annex, north face, 1995. Third floor, second window from the left: the reading room.' },
      { type: 'section', id: 'annex-rooms', label: 'Floor plan — third floor' },
      { type: 'photo', scene: 'floorplan', caption: 'Third-floor plan, redrawn by a volunteer from the county survey.' },
      {
        type: 'table',
        rows: [
          ['ROOM 01', 'Stacks A–F'],
          ['ROOM 02', 'Index room — sealed (see note)'],
          ['ROOM 03', 'Reading room'],
          ['ROOM 04', 'Night staff office'],
          ['ROOM 05', 'Microfilm'],
          ['ROOM 06', 'Storage'],
        ],
      },
      {
        type: 'p',
        text: 'County note: ROOM 02 was sealed in 1995 at the request of maintenance staff, who reported that the index cabinets inside could be heard opening at night. Its contents were never transferred. There is no ROOM_02 file in this archive.',
        variants: { 3: 'County note: ROOM 02 was sealed in 1995. Its contents were never transferred. There is no ROOM_02 file in this archive. Do not search for one.' },
      },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The building is private property. Please do not visit it.',
        variants: { 3: 'The building is private property. Please do not visit it. The lights on the third floor are not ours.' },
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '006',
    title: 'Tape 6 — Dictation Transcript',
    date: '1994-03-13',
    classification: 'Audio / Transcribed',
    access: 'public',
    summary: 'A dictation tape found in the night staff office, recorded the night before.',
    tags: ['tape', 'audio', 'transcript', 'dictation', 'varga', 'visitor'],
    blocks: [
      {
        type: 'p',
        text: 'Ms. Varga dictated her inventory notes onto microcassettes. Tape 6 was found in the recorder. Transcribed by a volunteer; inaudible passages are marked.',
      },
      { type: 'photo', scene: 'cassette', caption: 'Tape 6. Label in Ms. Varga’s handwriting.' },
      {
        type: 'transcript',
        lines: [
          '[01:41] Drawer two. Cards one through four hundred. All present.',
          '[01:47] Drawer three. Cards four hundred and one through… seven hundred? These aren’t ours. The handwriting is mine.',
          '[01:52] There is a card here for a visitor. We don’t have visitors at night.',
          '[01:56] It lists the time they arrive. It lists what they read.',
          '[01:58] [inaudible]',
          '[01:59] Someone has to stay on shift until they come.',
          '[02:00] [tape continues, 61 seconds, no speech]',
        ],
        variants: {
          3: [
            '[01:41] Drawer two. Cards one through four hundred. All present.',
            '[01:47] Drawer three. Cards four hundred and one through… seven hundred? These aren’t ours. The handwriting is mine.',
            '[01:52] There is a card here for a visitor. We don’t have visitors at night.',
            '[01:56] It lists the time they arrive. It lists what they read.',
            '[01:58] It lists what they read. It lists what they read.',
            '[01:59] Someone has to stay on shift until they come.',
            '[02:00] [61 seconds. Breathing, close to the microphone.]',
          ],
          5: [
            '[01:52] There is a card here for a visitor.',
            '[01:56] It lists the time they arrive.',
            '[01:59] Someone has to stay on shift until they come.',
            '[02:00] [61 seconds]',
            '[02:01] Oh. There you are.',
          ],
        },
      },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The final 61 seconds have been reviewed by three volunteers. Two heard nothing. The third asked to be removed from the project.',
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '007',
    title: 'Access Log — Night Index',
    date: '1994-03-15',
    classification: 'Restricted',
    access: 'restricted',
    summary: 'Access limited.',
    tags: ['restricted', 'index', 'log', 'terminal', '013'],
    blocks: [
      { type: 'notice', text: 'RESTRICTED RECORD — opened by VISITOR #{visitCount} at {now}.' },
      {
        type: 'p',
        text: 'This is the access log of the night index, printed from the Annex terminal on the morning of 15 March 1994. Entries are listed as they appear.',
      },
      {
        type: 'table',
        rows: [
          ['02:00 14/03', 'INDEX OPENED — operator: VARGA I.'],
          ['02:00 14/03', 'RECORD 013 CREATED — operator: none'],
          ['02:01 14/03', 'VARGA I. — status changed: ON SHIFT'],
          ['02:00 15/03', 'RECORD 014 CREATED — operator: none'],
          ['02:00 16/03', 'RECORD 015 CREATED — operator: none'],
          ['…', '…'],
          ['{now}', 'ACCESS — VISITOR #{visitCount}'],
        ],
      },
      {
        type: 'p',
        anomalyTarget: true,
        text: 'The index adds a record every night. It has never been printed past 013; the terminal jams. Readers who followed the broadcast order may continue to 013.',
      },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '008',
    title: 'Reading Room Notice',
    date: '2003-01-10',
    classification: 'Notice',
    access: 'public',
    summary: 'Hours and rules for the reading room, online and in person.',
    tags: ['hours', 'notice', 'rules', 'reading room', 'sync', '02:00'],
    blocks: [
      { type: 'photo', scene: 'notice', caption: 'Notice posted at the archive reading room.' },
      {
        type: 'notice',
        text: 'READING ROOM HOURS · 18:00 – 01:59\nPlease return all drawers to the index before leaving.\nThe reading room is not staffed between 02:00 and 02:01.',
        variants: {
          2: 'READING ROOM HOURS · 18:00 – 01:59\nPlease return all drawers to the index before leaving.\nThe reading room is not staffed between 02:00 and 02:01.\nIf the clock stops, do not wait for it to start again.',
          4: 'READING ROOM HOURS · 18:00 – 01:59\nThe reading room is not staffed between 02:00 and 02:01.\nIf the clock stops, do not wait for it to start again.\nDo not look at the doorway.\nIf someone offers you the shift, say no.',
        },
      },
      {
        type: 'p',
        text: 'Online visitors: this website is maintained by volunteers. Pages may behave unusually between 01:30 and 02:00 during the nightly archive sync. We apologise for any inconvenience.',
      },
      { type: 'p', anomalyTarget: true, text: 'Thank you for respecting the archive and the people who work in it.' },
      { type: 'section', id: 'record-end', label: 'End of record' },
    ],
  },
  {
    id: '009',
    title: 'Visitor Log',
    date: '—',
    classification: 'Night index',
    access: 'denied',
    summary: '[ACCESS DENIED]',
    tags: ['visitor', 'log', 'denied', 'you', 'me'],
    blocks: [
      { type: 'notice', text: 'VISITOR LOG — maintained by the night index. Entries are added automatically.' },
      { type: 'visitor-log' },
      {
        type: 'p',
        text: 'You first came at {firstVisitTime} on {firstVisitDate}. {returnsSentence} {reportSentence}',
      },
      { type: 'p', text: 'She has been keeping this log since 1994. Every visitor, every night. She is very tired.' },
      { type: 'p', anomalyTarget: true, text: 'Somebody has to take the shift.' },
      { type: 'link', href: '/unknown', label: 'Record 017 →' },
    ],
  },
  {
    id: '013',
    title: 'Index Continuation',
    date: '14/03/1994 02:00',
    classification: 'Night index / Unfiled',
    access: 'hidden',
    summary: 'Not filed by staff.',
    tags: ['013', 'index', 'continuation', 'unfiled', '017'],
    blocks: [
      { type: 'notice', text: 'This record was not filed by staff.' },
      {
        type: 'table',
        rows: [
          ['013', 'Index continuation (this record)'],
          ['014', 'Weather, 02:00 — every night since'],
          ['015', 'KVHN, 61 seconds — every night since'],
          ['016', 'VARGA I. — shift log (11,540 entries)'],
          ['017', 'VISITOR — unassigned'],
        ],
        variants: {
          4: [
            ['013', 'Index continuation (this record)'],
            ['014', 'Weather, 02:00 — every night since'],
            ['015', 'KVHN, 61 seconds — every night since'],
            ['016', 'VARGA I. — shift log (11,540 entries)'],
            ['017', 'VISITOR #{visitCount} — pending'],
          ],
        },
      },
      {
        type: 'p',
        text: 'Record 017 is waiting for a name. It can only be written at 02:00.',
      },
      {
        type: 'p',
        text: 'Continuation key, for the staff terminal: HARROW-0200. The terminal is not linked from this site. It is linked from her last sentence.',
      },
      { type: 'p', anomalyTarget: true, text: 'Thank you for following the order. Most people stop at 007.' },
      { type: 'link', href: '/unknown', label: 'Record 017 →' },
    ],
  },
];

export const RECORD_BY_ID: Record<string, ArchiveRecord> = Object.fromEntries(RECORDS.map((r) => [r.id, r]));

/** Records shown in the public index, in order. */
export const LISTED_RECORD_IDS = ['001', '002', '003', '004', '005', '006', '007', '008', '009'];

/** The broadcast order that unlocks Record 013 (Secret A). */
export const SEQUENCE_A = ['001', '003', '007'];

export const CONTINUATION_KEY = 'HARROW-0200';
