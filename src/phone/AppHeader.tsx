/**
 * iOS 26 navigation bar: a round glass back button (just the chevron — the
 * label is for screen readers), a centred title, and on an app's first
 * screen the big left-aligned title underneath.
 */
export function AppHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
  large = false,
  avatar,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  /** An app's root screen: the large title. */
  large?: boolean;
  /** A conversation: the contact's picture above the name. */
  avatar?: React.ReactNode;
}) {
  return (
    <header className={`app-header${large ? ' large' : ''}${avatar ? ' with-avatar' : ''}`}>
      {onBack ? (
        <button type="button" className="back" onClick={onBack} aria-label={backLabel ?? '뒤로'}>
          <svg className="back-chev" viewBox="0 0 12 20" aria-hidden="true">
            <path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span />
      )}
      <div className="app-title">
        {avatar && <span className="app-title-avatar">{avatar}</span>}
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <span className="app-header-right">{right}</span>
      {large && title && (
        <h1 className="large-title" aria-hidden="true">
          {title}
        </h1>
      )}
    </header>
  );
}
