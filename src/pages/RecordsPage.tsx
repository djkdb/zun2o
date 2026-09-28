import { RecordList } from '../components/RecordList';
import { useVisualLevel } from '../hooks/useGame';

export function RecordsPage() {
  const level = useVisualLevel();
  return (
    <>
      <h2 className="page-title">All records</h2>
      <p className="small">
        Records are listed in the order they were catalogued. Restricted records require prior consultation of the records they
        reference. {level >= 3 ? 'Denied records are denied for your protection.' : 'Denied records are withheld at the request of the county.'}
      </p>
      <RecordList showSummary />
    </>
  );
}
