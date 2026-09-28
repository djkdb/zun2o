import { RecordList } from '../components/RecordList';
import { useVisualLevel } from '../hooks/useGame';

export function RecordsPage() {
  const level = useVisualLevel();
  return (
    <>
      <h2 className="page-title">전체 기록</h2>
      <p className="small">
        기록은 목록에 등록된 순서대로 표시됩니다. 열람 제한 기록은 그 기록이 참조하는 기록을 먼저 열람해야 볼 수 있습니다.{' '}
        {level >= 3 ? '접근 거부된 기록은 당신을 보호하기 위해 거부된 것입니다.' : '접근 거부된 기록은 군청의 요청으로 비공개 처리되어 있습니다.'}
      </p>
      <RecordList showSummary />
    </>
  );
}
