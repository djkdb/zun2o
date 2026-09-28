/** Handset glyph for call buttons (emoji ☎ renders inconsistently). */
export function CallIcon({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" style={{ width: 30, height: 30, transform: down ? 'rotate(135deg)' : undefined }} aria-hidden="true">
      <path
        fill="#fff"
        d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"
      />
    </svg>
  );
}
