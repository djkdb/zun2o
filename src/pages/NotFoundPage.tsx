import { useVisualLevel } from '../hooks/useGame';
import { href } from '../utils/router';

// An old Apache error page. It is the one page on the site that pretends to
// be outside the fiction — which is why it hides a line in white.

export function NotFoundPage({ path }: { path: string }) {
  const level = useVisualLevel();
  return (
    <div className="not-found" role="main">
      <h1>Not Found</h1>
      <p>The requested URL {path.replace(/[<>]/g, '')} was not found on this server.</p>
      <p className="extra">{level >= 2 ? '직원 페이지는 그녀의 마지막 문장 뒤에 있다. 기록 003.' : ''}</p>
      <hr />
      <address>Apache/1.3.27 Server at nightarchive.harrow-county.org Port 80</address>
      <p>
        <a href={href('/')}>보관소로 돌아가기</a>
      </p>
    </div>
  );
}
