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
    showNotice('Something has been unlocked.');
  };
  return (
    <blockquote className="secret-sentence">
      {block.before}
      <button type="button" onClick={onClick} aria-label={found ? block.text : `${block.text} (the last line is pressed hard into the paper)`}>
        {block.text}
      </button>
      {block.after}
      {found && (
        <span className="revealed">
          On the back of the sheet, in the same hand: <a href={href('/system')}>/system</a>
        </span>
      )}
    </blockquote>
  );
}

function VisitorLog({ save }: { save: SaveData }) {
  const entries = save.visitLog.slice().reverse();
  return (
    <ol className="visitor-log" aria-label="Visitor log">
      {entries.map((t, i) => {
        const d = new Date(t);
        return (
          <li key={t} className={i === 0 ? 'current' : undefined}>
            <span>
              VISITOR #{String(save.visitCount).padStart(4, '0')} {i === 0 ? '(now)' : ''}
            </span>
            <span>
              {d.toLocaleDateString('en-GB')} {formatClock(partsOf(d))}
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
        <div className="record-kicker">Record #{record.id}</div>
      </div>
      <div className="access-panel" role="alert">
        <div className="stamp">{message}</div>
        {detail && <p>{detail}</p>}
        {record.access === 'denied' && <p>Server time: {formatClock(partsOf(new Date(now)))}</p>}
        <p>
          <a href={href('/records')}>Return to the index</a>
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
      if (findSecret('C')) showNotice('Record 009 is open. It has been open since 02:00.');
    }
    if (id === '013') {
      if (findSecret('A')) showNotice('Index continuation found.');
    }
  }, [id, ok, record]);

  if (!record) {
    return (
      <article>
        <div className="access-panel" role="alert">
          <div className="stamp">RECORD NOT FOUND</div>
          <p>Record #{id.replace(/[^0-9a-z]/gi, '').slice(0, 6)} was never assigned.</p>
          <p>
            <a href={href('/records')}>Return to the index</a>
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
        <div className="record-kicker">Record #{record.id}</div>
        <RecordTitle record={record} level={level} />
        <div className="record-meta">
          <span>Date: {record.date}</span>
          <span>Classification: {record.classification}</span>
          <span>Views: {save.recordViews[id] ?? 1}</span>
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
                RECORD 013 has been added to the index. <a href={href('/record/013')}>Open Record 013 →</a>
              </>
            ) : (
              'The continuation is issued only to readers who follow the broadcast order.'
            )}
          </div>
        )}
      </div>
      <nav className="record-nav" aria-label="Record navigation">
        {prev ? <a href={href(`/record/${prev}`)}>← Record #{prev}</a> : <span />}
        <a href={href('/records')}>Index</a>
        {next ? <a href={href(`/record/${next}`)}>Record #{next} →</a> : <span />}
      </nav>
    </article>
  );
}
