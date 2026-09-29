import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx } from '../../engine/director';
import { addFlag, getState, setRt, setSave } from '../../engine/state';
import { ARCHIVE, ARCHIVE_LIST, ARCHIVE_SEQUENCE } from '../../content/archive';
import { AppHeader } from '../AppHeader';
import { art } from '../../art/photoArt';
import { SlotPhoto } from '../../art/phonePhotos';
import { AnnexPhoto, FloorPlan, ReadingRoomPhoto, Room02Photo, TowerPhoto } from '../../art/scenes';

const PHOTO = {
  'reading-room': () => (art('reading-empty') ? <SlotPhoto slot="reading-empty" label="1994년 열람실." /> : <ReadingRoomPhoto level={3} stage={1} />),
  annex: () => (art('annex-gate') ? <SlotPhoto slot="annex-gate" label="해원군청 별관." /> : <AnnexPhoto level={3} />),
  floorplan: () => <FloorPlan level={3} />,
  tower: () => (art('tower') ? <SlotPhoto slot="tower" label="해원방송 송신탑." /> : <TowerPhoto level={0} />),
  'room-02': () => (art('room02') ? <SlotPhoto slot="room02" label="02호실." /> : <Room02Photo level={5} />),
};

type View = { kind: 'home' } | { kind: 'archive' } | { kind: 'page'; id: string };

function seenPages(): string[] {
  return (getState().save.choices.archiveSeen ?? '').split(',').filter(Boolean);
}

export function BrowserApp() {
  const [view, setView] = useState<View>(() => (getState().rt.deep?.kind === 'archive' ? { kind: 'archive' } : { kind: 'home' }));
  useEffect(() => {
    if (getState().rt.deep) setRt({ deep: null });
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const indexed = useGame((s) => s.save.flags.includes('r013-indexed'));

  const openPage = (id: string) => {
    const page = ARCHIVE[id];
    const seen = seenPages();
    sfx('click');
    setNotice(null);
    if (page.access === 'restricted' && !(seen.includes('r001') && seen.includes('r003'))) {
      setView({ kind: 'page', id: '__restricted' });
      return;
    }
    const seq = [...(getState().save.choices.archiveSeq ?? '').split(',').filter(Boolean), id].slice(-3);
    setSave((s) => ({
      choices: { ...s.choices, archiveSeq: seq.join(','), archiveSeen: Array.from(new Set([...seen, id])).join(',') },
    }));
    if (id === 'r013' && !getState().save.flags.includes('self-contact')) {
      setView({ kind: 'page', id: '__early' });
      emit('browser:r013-early');
      return;
    }
    setView({ kind: 'page', id });
    emit(`browser:${id}`);
    if (!indexed && seq.join(',') === ARCHIVE_SEQUENCE.join(',')) {
      // Too early: record 013 is being written about *you*, and you aren't there yet.
      if (!getState().save.flags.includes('self-contact')) {
        setTimeout(() => setNotice('기록 013 — 작성 중입니다. 나중에 다시 순서대로 열람하세요.'), 900);
        return;
      }
      addFlag('r013-indexed');
      setTimeout(() => {
        sfx('unlock');
        setNotice('기록 013이 색인에 추가되었습니다.');
      }, 900);
    }
  };

  const back = () => {
    setNotice(null);
    if (view.kind === 'page') setView({ kind: view.id.startsWith('news') ? 'home' : 'archive' });
    else if (view.kind === 'archive') setView({ kind: 'home' });
    else openApp(null);
  };

  const url = view.kind === 'home' ? '즐겨찾기' : view.kind === 'archive' || (view.kind === 'page' && !view.id.startsWith('news')) ? 'nightarchive.or.kr' : 'haewon-ilbo.kr';

  return (
    <div className="browser">
      <AppHeader title={url} onBack={back} backLabel={view.kind === 'home' ? '홈' : '뒤로'} />
      {view.kind === 'home' && (
        <div className="bookmarks">
          <p className="bm-label">즐겨찾기</p>
          <button type="button" className="bm" onClick={() => setView({ kind: 'archive' })}>
            <span className="bm-icon archive">夜</span>
            <span>
              <strong>심야 기록보관소</strong>
              <small>nightarchive.or.kr — 해원군청 별관 기록 보존</small>
            </span>
          </button>
          <button type="button" className="bm" onClick={() => openPage('news2')}>
            <span className="bm-icon news">해</span>
            <span>
              <strong>해원일보 — 실종 1년 대학생, 별관 앞 공중전화 부스에서 발견</strong>
              <small>오늘 06:12 · 이 폰에서 열어 본 기사</small>
            </span>
          </button>
          <button type="button" className="bm" onClick={() => openPage('news')}>
            <span className="bm-icon news">해</span>
            <span>
              <strong>해원일보 — 폐건물 촬영 나선 유튜버 실종</strong>
              <small>오늘 · 방문 기록 없음</small>
            </span>
          </button>
        </div>
      )}
      {view.kind === 'archive' && (
        <div className="archive">
          <h2>심야 기록보관소</h2>
          <p className="archive-sub">1995년 폐쇄된 해원군청 별관 기록 · 자원봉사자 운영 · 최종 수정 2004.11.02</p>
          <ul>
            {[...ARCHIVE_LIST, ...(indexed ? ['r013'] : [])].map((id) => (
              <li key={id}>
                <button type="button" className={id === 'r013' ? 'new' : undefined} onClick={() => openPage(id)}>
                  {ARCHIVE[id].title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {view.kind === 'page' && view.id === '__early' && (
        <div className="archive-page denied">
          <div className="stamp">작성 중</div>
          <p>기록 013 — 아직 작성되지 않았습니다.</p>
          <p className="archive-sub">작성 예정: 01:44 · 작성자: 야간 색인</p>
        </div>
      )}
      {view.kind === 'page' && view.id === '__restricted' && (
        <div className="archive-page denied">
          <div className="stamp">열람 제한</div>
          <p>이 기록이 참조하는 기록(001, 003)을 먼저 열람한 사람만 볼 수 있습니다.</p>
        </div>
      )}
      {view.kind === 'page' && ARCHIVE[view.id] && (
        <article className={`archive-page${ARCHIVE[view.id].access === 'denied' ? ' denied' : ''}`}>
          <h2>{ARCHIVE[view.id].title}</h2>
          {ARCHIVE[view.id].photo && <div className="archive-photo">{PHOTO[ARCHIVE[view.id].photo!]()}</div>}
          {ARCHIVE[view.id].lines.map((l, i) => (
            <p key={i} className={l.includes('HAEWON-0200') ? 'key-line' : undefined}>
              {l}
            </p>
          ))}
          {notice && <div className="archive-notice">{notice}</div>}
        </article>
      )}
    </div>
  );
}
