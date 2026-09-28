import type { SecretDef } from '../game/types';

export const SECRETS: SecretDef[] = [
  {
    id: 'A',
    name: '방송 순서',
    hint: '라디오는 숫자 네 개를 읽었다.',
    description: '목소리가 읽은 순서대로 기록 001 → 003 → 007을 연 뒤, 기록 013을 연다.',
  },
  {
    id: 'B',
    name: '그녀의 마지막 문장',
    hint: '그녀는 마지막 줄을 꾹꾹 눌러 썼다.',
    description: '기록 003의 마지막 문장을 누른 뒤, 직원용 단말기에서 알 수 없는 파일을 연다.',
  },
  {
    id: 'C',
    name: '방문자 기록',
    hint: '기록 009는 이 시간에 열람할 수 없다.',
    description: '02:00~02:59 사이에 기록 009를 연다.',
  },
  {
    id: 'D',
    name: '이관되지 않은 방',
    hint: '이 보관소에는 02호실 파일이 존재하지 않는다.',
    description: '보관소가 불안해졌을 때, 존재하지 않는다는 파일을 검색한다.',
  },
];

export const SECRET_BY_ID = Object.fromEntries(SECRETS.map((s) => [s.id, s])) as Record<SecretDef['id'], SecretDef>;
