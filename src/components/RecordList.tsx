import { useGame, useAnomaly, useVisualLevel } from '../hooks/useGame';
import { emit } from '../game/store';
import { listedRecords } from '../game/secretManager';
import { variantFor } from '../game/horrorEngine';
import { RECORD_BY_ID } from '../data/records';
import { href } from '../utils/router';
import type { ArchiveRecord, HorrorLevel } from '../game/types';

interface Row {
  key: string;
  record: ArchiveRecord;
  className?: string;
}

function rowTitle(record: ArchiveRecord, level: HorrorLevel): string {
  if (record.access === 'denied' && level < 5) return '[ACCESS DENIED]';
  if (record.access === 'restricted') return level >= 5 ? record.title : 'Restricted record';
  return variantFor(record.title, record.titleVariants, level);
}

function rowFlag(record: ArchiveRecord, level: HorrorLevel): string | null {
  if (record.access === 'restricted') return 'RESTRICTED';
  if (record.access === 'denied') return level >= 5 ? 'OPEN 02:00–02:59' : 'DENIED';
  if (record.access === 'hidden') return 'UNFILED';
  return null;
}

export function RecordList({ showSummary = false }: { showSummary?: boolean }) {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const anomaly = useAnomaly('record-list');
  const newlyIndexed = useGame((s) => s.save.flags.includes('record-013-indexed') && (s.save.recordViews['013'] ?? 0) === 0);

  const rows: Row[] = listedRecords(save).map((id) => ({
    key: id,
    record: RECORD_BY_ID[id],
    className: id === '013' && newlyIndexed ? 'new-entry' : undefined,
  }));
  if (anomaly?.effect === 'duplicate') {
    const i = rows.findIndex((r) => r.key === '003');
    if (i >= 0) rows.splice(i + 1, 0, { key: '003-dup', record: RECORD_BY_ID['003'] });
  }
  if (anomaly?.effect === 'phantom-013' && !rows.some((r) => r.key === '013')) {
    rows.push({ key: '013-phantom', record: RECORD_BY_ID['013'], className: 'phantom' });
  }

  return (
    <ul className={['record-list', anomaly?.effect === 'hover-offset' ? 'hover-offset' : ''].filter(Boolean).join(' ')}>
      {rows.map(({ key, record, className }) => {
        const renamed = anomaly?.effect === 'rename-007' && record.id === '007';
        const flag = rowFlag(record, level);
        const phantom = key === '013-phantom';
        return (
          <li key={key} className={className}>
            <a
              href={href(`/record/${record.id}`)}
              data-record={record.id}
              onPointerEnter={() => emit({ type: 'hover', target: `record-${record.id}` })}
              onFocus={() => emit({ type: 'hover', target: `record-${record.id}` })}
            >
              <span className="rec-id">RECORD #{record.id}</span>
              <span className="rec-title">
                {phantom ? 'Not indexed' : renamed ? String(anomaly.payload?.text ?? 'DO NOT OPEN') : rowTitle(record, level)}
                {flag && !phantom && <span className="rec-flag">{flag}</span>}
                {showSummary && !phantom && (
                  <span className="rec-summary">{record.access === 'denied' && level < 5 ? 'Not available at this hour.' : variantFor(record.summary, record.summaryVariants, level)}</span>
                )}
              </span>
              <span className="rec-meta">{phantom ? '02:00' : record.date}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
