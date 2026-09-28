import { useEffect } from 'react';
import { dismissNotice } from '../game/store';
import { useGame } from '../hooks/useGame';

export function NoticeToast() {
  const notice = useGame((s) => s.session.notice);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(dismissNotice, 6000);
    return () => clearTimeout(t);
  }, [notice]);
  if (!notice) return null;
  return (
    <div key={notice.nonce} className="toast" role="status">
      {notice.text}
    </div>
  );
}
