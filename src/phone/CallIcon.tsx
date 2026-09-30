/** Handset glyph for call buttons (emoji ☎ renders inconsistently). */
export function CallIcon({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" style={{ width: 30, height: 30 }} aria-hidden="true">
      {down ? (
        // Hang up: the handset lying flat, drawn centred (a rotated handset sits off-centre in the button).
        <path
          fill="#fff"
          d="M1.8 13.6C1.8 10.3 6.4 8 12 8s10.2 2.3 10.2 5.6v1.5a1.2 1.2 0 01-1.4 1.2l-3.3-.6a1.2 1.2 0 01-1-1.2v-1.8c-1.4-.5-2.9-.7-4.5-.7s-3.1.2-4.5.7v1.8a1.2 1.2 0 01-1 1.2l-3.3.6a1.2 1.2 0 01-1.4-1.2z"
        />
      ) : (
        <path
          fill="#fff"
          d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"
        />
      )}
    </svg>
  );
}
