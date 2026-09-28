import { useEffect, useRef, useState } from 'react';
import { GlitchText } from '../components/GlitchText';
import { ArchivePhoto } from '../components/ArchivePhoto';
import { RECORD_BY_ID } from '../data/records';
import { canOpenRecord, listedRecords } from '../game/secretManager';
import { variantFor } from '../game/horrorEngine';
import { fillTemplate } from '../game/template';
import { emit, findSecret, playSound, recordOpened, setFlag, showNotice } from '../game/store';
import { getNow } from '../game/clock';
import { useAnomaly, useGame, useVisualLevel } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { href } from '../utils/router';
import { formatClock, partsOf } from '../utils/time';
import type { ArchiveRecord, HorrorLevel, RecordBlock, SaveData } from '../game/types';

function SectionMarker({ id, label, recordId }: { id: string; label: string; recordId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        emit({ type: 'section', target: id });
        emit({ type: 'section', target: `${id}@${recordId}` });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, recordId]);
  return (
    <div ref={ref} className={`section-marker${id === 'record-end' ? ' end' : ''}`} data-section={id}>
      {id === 'record-end' ? `— ${label} —` : label}
    </div>
  );
}

function SecretSentence({ block }: { block: Extract<RecordBlock, { type: 'secret-sentence' }> }) {
  const found = useGame((s) => s.save.flags.includes('sentence-found'));
  const onClick = () => {
    if (found) return;
    setFlag('sentence-found');
    setFlag('system-unlocked');
    playSound('unlock');
    showNotice('무언가가 열렸습니다.');
  };
  return (
    <blockquote className="secret-sentence">
      {block.before}
      <button type="button" onClick={onClick} aria-label={found ? block.text : `${block.text} (마지막 줄이 종이에 꾹 눌려 있다)`}>
        {block.text}
      </button>
      {block.after}
      {found && (
        <span className="revealed">
          종이 뒷면에 같은 필체로: <a href={href('/system')}>/system</a>
        </span>
      )}
    </blockquote>
  );
}

function VisitorLog({ save }: { save: SaveData }) {
  const entries = save.visitLog.slice().reverse();
  return (
    <ol className="visitor-log" aria-label="방문자 기록">
      {entries.map((t, i) => {
        const d = new Date(t);
        return (
          <li key={t} className={i === 0 ? 'current' : undefined}>
            <span>
              방문자 #{String(save.visitCount).padStart(4, '0')} {i === 0 ? '(지금)' : ''}
            </span>
            <span>
              {d.toLocaleDateString('ko-KR')} {formatClock(partsOf(d))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Block({ block, level, save, now, disturbed, recordId }: { block: RecordBlock; level: HorrorLevel; save: SaveData; now: number; disturbed: boolean; recordId: string }) {
  const anomaly = useAnomaly('record-body');
  const t = (text: string) => fillTemplate(text, { save, now });
  switch (block.type) {
    case 'p':
      if (block.minLevel !== undefined && level < block.minLevel) return null;
      return <GlitchText as="p" text={t(variantFor(block.text, block.variants, level))} anomaly={disturbed ? anomaly : null} />;
    case 'h':
      return <h3>{t(variantFor(block.text, block.variants, level))}</h3>;
    case 'photo':
      return <ArchivePhoto scene={block.scene} caption={variantFor(block.caption, block.captionVariants, level)} />;
    case 'table': {
      const rows = variantFor(block.rows, block.variants, level);
      return (
        <table className="data-table">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={`${k}-${i}`}>
                <th scope="row">{t(k)}</th>
                <td>{t(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case 'transcript': {
      const lines = variantFor(block.lines, block.variants, level);
      return (
        <ul className="transcript">
          {lines.map((l, i) => (
            <li key={i}>{t(l)}</li>
          ))}
        </ul>
      );
    }
    case 'notice':
      return <div className="notice">{t(variantFor(block.text, block.variants, level))}</div>;
    case 'section':
      return <SectionMarker id={block.id} label={block.label} recordId={recordId} />;
    case 'secret-sentence':
      return <SecretSentence block={block} />;
    case 'visitor-log':
      return <VisitorLog save={save} />;
    case 'link':
      return (
        <p>
          <a href={href(block.href)}>{block.label}</a>
        </p>
      );
  }
}

function RecordTitle({ record, level }: { record: ArchiveRecord; level: HorrorLevel }) {
  const anomaly = useAnomaly('record-title');
  return <GlitchText as="h2" className="record-title" text={variantFor(record.title, record.titleVariants, level)} anomaly={anomaly} />;
}

function Denied({ record, message, detail }: { record: ArchiveRecord; message: string; detail?: string }) {
  const now = useLocalTime();
  return (
    <article>
      <div className="record-head">
        <div className="record-kicker">기록 #{record.id}</div>
      </div>
      <div className="access-panel" role="alert">
        <div className="stamp">{message}</div>
        {detail && <p>{detail}</p>}
        {record.access === 'denied' && <p>서버 시각: {formatClock(partsOf(new Date(now)))}</p>}
        <p>
          <a href={href('/records')}>목록으로 돌아가기</a>
        </p>
      </div>
    </article>
  );
}

export function RecordPage({ id }: { id: string }) {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const record = RECORD_BY_ID[id];
  const access = record ? canOpenRecord(record, save, level) : null;
  const ok = access?.ok ?? false;
  const opened = useRef<string | null>(null);
  const [now] = useState(() => getNow());

  useEffect(() => {
    if (!record) return;
    const key = `${id}:${ok}`;
    if (opened.current === key) return;
    opened.current = key;
    if (!ok) {
      playSound('error');
      return;
    }
    recordOpened(id);
    if (id === '009') {
      if (findSecret('C')) showNotice('기록 009가 열렸습니다. 02:00부터 열려 있었습니다.');
    }
    if (id === '013') {
      if (findSecret('A')) showNotice('색인 연장 기록을 찾았습니다.');
    }
  }, [id, ok, record]);

  if (!record) {
    return (
      <article>
        <div className="access-panel" role="alert">
          <div className="stamp">기록 없음</div>
          <p>기록 #{id.replace(/[^0-9a-z]/gi, '').slice(0, 6)}은(는) 배정된 적이 없습니다.</p>
          <p>
            <a href={href('/records')}>목록으로 돌아가기</a>
          </p>
        </div>
      </article>
    );
  }
  if (access && !access.ok) return <Denied record={record} message={access.message} detail={access.detail} />;

  const listed = listedRecords(save);
  const idx = listed.indexOf(id);
  const prev = idx > 0 ? listed[idx - 1] : null;
  const next = idx >= 0 && idx < listed.length - 1 ? listed[idx + 1] : null;
  const firstDisturbable = record.blocks.findIndex((b) => b.type === 'p' && b.anomalyTarget);
  const indexed = save.flags.includes('record-013-indexed');

  return (
    <article className="record" aria-labelledby="record-title">
      <header className="record-head" id="record-title">
        <div className="record-kicker">기록 #{record.id}</div>
        <RecordTitle record={record} level={level} />
        <div className="record-meta">
          <span>일자: {record.date}</span>
          <span>분류: {record.classification}</span>
          <span>열람: {save.recordViews[id] ?? 1}회</span>
        </div>
      </header>
      <div className="record-body">
        {record.blocks.map((block, i) => (
          <Block key={i} block={block} level={level} save={save} now={now} disturbed={i === firstDisturbable} recordId={record.id} />
        ))}
        {id === '007' && (
          <div className="notice">
            {indexed ? (
              <>
                기록 013이 색인에 추가되었습니다. <a href={href('/record/013')}>기록 013 열기 →</a>
              </>
            ) : (
              '연장 기록은 방송 순서를 따라온 열람자에게만 발급됩니다.'
            )}
          </div>
        )}
      </div>
      <nav className="record-nav" aria-label="기록 이동">
        {prev ? <a href={href(`/record/${prev}`)}>← 기록 #{prev}</a> : <span />}
        <a href={href('/records')}>목록</a>
        {next ? <a href={href(`/record/${next}`)}>기록 #{next} →</a> : <span />}
      </nav>
    </article>
  );
}
