import { Terminal } from '../components/Terminal';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { NotFoundPage } from './NotFoundPage';

export function SystemPage() {
  const unlocked = useGame((s) => s.save.flags.includes('system-unlocked'));
  const level = useVisualLevel();
  if (!unlocked && level < 5) return <NotFoundPage path="/system" />;
  return <Terminal />;
}
