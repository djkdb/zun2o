export function AppHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="app-header">
      {onBack ? (
        <button type="button" className="back" onClick={onBack}>
          ‹ {backLabel ?? '뒤로'}
        </button>
      ) : (
        <span />
      )}
      <div className="app-title">
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <span className="app-header-right">{right}</span>
    </header>
  );
}
