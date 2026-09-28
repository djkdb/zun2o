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
      <p className="extra">{level >= 2 ? 'the staff page is behind her last sentence. record 003.' : ''}</p>
      <hr />
      <address>Apache/1.3.27 Server at nightarchive.harrow-county.org Port 80</address>
      <p>
        <a href={href('/')}>Return to the archive</a>
      </p>
    </div>
  );
}
