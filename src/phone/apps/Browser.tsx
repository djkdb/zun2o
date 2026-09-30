import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx } from '../../engine/director';
import { addFlag, getState, setRt, setSave } from '../../engine/state';
import { ARCHIVE, ARCHIVE_LIST, ARCHIVE_SEQUENCE, type ArchivePage } from '../../content/archive';
import { AppHeader } from '../AppHeader';
import { art } from '../../art/photoArt';
import { SlotPhoto } from '../../art/phonePhotos';
import { AnnexPhoto, FloorPlan, ReadingRoomPhoto, Room02Photo, TowerPhoto } from '../../art/scenes';

const PHOTO = {
  'reading-room': () => (art('reading-empty') ? <SlotPhoto slot="reading-empty" w={640} h={420} label="1994년 열람실." /> : <ReadingRoomPhoto level={3} stage={1} />),
  annex: () => (art('wallpaper') ? <SlotPhoto slot="wallpaper" w={640} h={420} label="해원고등학교." /> : <AnnexPhoto level={3} />),
  floorplan: () => <FloorPlan level={3} />,
  tower: () => (art('tower') ? <SlotPhoto slot="tower" w={640} h={420} align="xMidYMin" label="해원방송 송신탑." /> : <TowerPhoto level={0} />),
  'room-02': () => (art('room02') ? <SlotPhoto slot="room02" w={640} h={420} label="제2서고." /> : <Room02Photo level={5} />),
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
    // Reached the last record of the sequence, but not in broadcast order: say so, without saying the order.
    if (!indexed && id === ARCHIVE_SEQUENCE[ARCHIVE_SEQUENCE.length - 1] && seq.join(',') !== ARCHIVE_SEQUENCE.join(',') && getState().save.flags.includes('self-contact')) {
      setTimeout(() => setNotice('열람 순서가 방송 순서와 다릅니다. 기록 013은 목록에 추가되지 않았습니다.'), 900);
    }
    if (!indexed && seq.join(',') === ARCHIVE_SEQUENCE.join(',')) {
      // Too early: record 013 is being written about *you*, and you aren't there yet.
      if (!getState().save.flags.includes('self-contact')) {
        setTimeout(() => setNotice('기록 013 — 작성 중입니다. 나중에 다시 순서대로 열람하세요.'), 900);
        return;
      }
      addFlag('r013-indexed');
      setSave({ objective: { text: '목록에 새로 생긴 기록 013을 열어 보자', hint: '인터넷 → 심야 기록보관소 → 맨 아래 기록 013.', since: Date.now() } });
      setTimeout(() => {
        sfx('unlock');
        setNotice('기록 013이 목록에 추가되었습니다.');
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
            <span className="bm-icon bm-icon-archive">夜</span>
            <span>
              <strong>심야 기록보관소</strong>
              <small>nightarchive.or.kr — 폐교 해원고등학교 기록 보존</small>
            </span>
          </button>
          <button type="button" className="bm" onClick={() => openPage('news2')}>
            <span className="bm-icon bm-icon-news">해</span>
            <span>
              <strong>해원일보 — 실종 1년 대학생, 폐교 앞 공중전화 부스에서 발견</strong>
              <small>9월 27일 06:12 · 이 폰에서 열어 본 기사</small>
            </span>
          </button>
          <button type="button" className="bm" onClick={() => openPage('news')}>
            <span className="bm-icon bm-icon-news">해</span>
            <span>
              <strong>해원일보 — 폐건물 촬영 나선 유튜버 실종</strong>
              <small>9월 27일 18:30 · 방문 기록 없음</small>
            </span>
          </button>
        </div>
      )}
      {view.kind === 'archive' && (
        <div className="archive arc-site">
          <header className="arc-head">
            <span className="arc-logo">夜</span>
            <div>
              <h2>심야 기록보관소</h2>
              <p>1995년 폐교된 해원고등학교 기록 · 자원봉사자 운영</p>
            </div>
          </header>
          <p className="arc-counter">
            누적 방문자 <b>000413</b> · 지금 보는 사람 <b className="arc-blink">2</b>
          </p>
          <ul className="arc-list">
            {[...ARCHIVE_LIST, ...(indexed ? ['r013'] : [])].map((id) => {
              const p = ARCHIVE[id];
              const [no, name] = p.title.replace('기록 ', '').split(' — ');
              const badge = id === 'r013' ? 'NEW' : p.access === 'restricted' ? '열람 제한' : p.access === 'denied' ? '접근 거부' : null;
              return (
                <li key={id}>
                  <button type="button" className={id === 'r013' ? 'new' : undefined} onClick={() => openPage(id)} aria-label={badge ? `${p.title} (${badge})` : p.title}>
                    <span className="arc-no">{no}</span>
                    <span className="arc-name">{name.replace(' (열람 제한)', '').replace('[접근 거부]', '— — —')}</span>
                    {badge && <span className={`arc-badge${id === 'r013' ? ' new' : ''}`}>{badge}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="arc-foot">최종 수정 2004.11.02 · 운영자 연락처 없음 · 이 사이트는 더 이상 관리되지 않습니다</p>
        </div>
      )}
      {view.kind === 'page' && view.id === '__early' && (
        <div className="archive-page denied">
          <div className="stamp">작성 중</div>
          <p>기록 013 — 아직 작성되지 않았습니다.</p>
          <p className="archive-sub">작성 예정: 01:44 · 작성자: 없음</p>
        </div>
      )}
      {view.kind === 'page' && view.id === '__restricted' && (
        <div className="archive-page denied">
          <div className="stamp">열람 제한</div>
          <p>이 기록이 참조하는 기록(001, 003)을 먼저 열람한 사람만 볼 수 있습니다.</p>
        </div>
      )}
      {view.kind === 'page' && ARCHIVE[view.id]?.news && <NewsArticle page={ARCHIVE[view.id]} onOpen={openPage} />}
      {view.kind === 'page' && ARCHIVE[view.id] && !ARCHIVE[view.id].news && (
        <div className="arc-site arc-page-wrap">
          <article className={`archive-page arc-doc${ARCHIVE[view.id].access === 'denied' ? ' denied' : ''}`}>
            <p className="arc-doc-no">{ARCHIVE[view.id].title.split(' — ')[0]}</p>
            <h2>{ARCHIVE[view.id].title.split(' — ')[1]}</h2>
            {ARCHIVE[view.id].meta && <p className="arc-doc-meta">{ARCHIVE[view.id].meta}</p>}
            {ARCHIVE[view.id].access === 'restricted' && <div className="stamp arc-stamp">열람 제한</div>}
            {ARCHIVE[view.id].photo && <div className="archive-photo arc-scan">{PHOTO[ARCHIVE[view.id].photo!]()}</div>}
            {ARCHIVE[view.id].lines.map((l, i) => (
              <p key={i} className={l.includes('HAEWON-0200') ? 'key-line' : undefined}>
                <Rich text={l} />
              </p>
            ))}
          </article>
          {notice && <div className="archive-notice">{notice}</div>}
        </div>
      )}
    </div>
  );
}

/** `**…**` → emphasis, so a skimming reader still catches the point. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
    </>
  );
}

/** 해원일보: laid out like a real mobile news page. */
function NewsArticle({ page, onOpen }: { page: ArchivePage; onOpen: (id: string) => void }) {
  const n = page.news!;
  const other = page.id === 'news' ? 'news2' : 'news';
  const [lead, ...rest] = page.lines;
  return (
    <article className="news">
      <header className="news-mast">
        <span className="news-logo">해원일보</span>
        <span className="news-menu" aria-hidden="true">
          ☰
        </span>
      </header>
      <div className="news-body">
        <p className="news-section">{n.section}</p>
        <h1>{page.title.replace('해원일보 — ', '')}</h1>
        <p className="news-sub">{n.subtitle}</p>
        <p className="news-by">
          <b>{n.byline}</b> · {n.time}
        </p>
        {page.photo && (
          <figure className="news-photo">
            {PHOTO[page.photo]()}
            <figcaption>{n.caption}</figcaption>
          </figure>
        )}
        <p className="news-lead">
          <Rich text={lead.replace('[해원일보] ', '')} />
        </p>
        {rest.slice(0, 1).map((l) => (
          <p key={l}>
            <Rich text={l} />
          </p>
        ))}
        <blockquote className="news-quote">{n.quote}</blockquote>
        {rest.slice(1).map((l) => (
          <p key={l}>
            <Rich text={l} />
          </p>
        ))}
        <p className="news-copy">ⓒ 해원일보 · 무단 전재 및 재배포 금지</p>
        <button type="button" className="news-related" onClick={() => onOpen(other)}>
          <small>관련 기사</small>
          <span>{ARCHIVE[other].title.replace('해원일보 — ', '')}</span>
        </button>
      </div>
    </article>
  );
}

