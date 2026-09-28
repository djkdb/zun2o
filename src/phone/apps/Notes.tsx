import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp } from '../../engine/director';
import { fill } from '../../engine/state';
import { NOTES } from '../../content/media';
import { AppHeader } from '../AppHeader';

export function NotesApp() {
  const ids = useGame((s) => s.save.notes);
  const [open, setOpen] = useState<string | null>(null);
  // Re-render when the name changes so n4 stays current.
  useGame((s) => s.save.playerName);

  if (open) {
    const note = NOTES[open];
    return (
      <div className="notes-app">
        <AppHeader title="메모" onBack={() => setOpen(null)} backLabel="목록" />
        <article className="note-body">
          <h2>{note.title}</h2>
          <small>{note.date}</small>
          <pre>{fill(note.body)}</pre>
        </article>
      </div>
    );
  }
  return (
    <div className="notes-app">
      <AppHeader title="메모" onBack={() => openApp(null)} backLabel="홈" />
      <ul className="note-list">
        {[...ids].reverse().map((id) => {
          const n = NOTES[id];
          return (
            <li key={id}>
              <button
                type="button"
                className={id === 'n4' ? 'new' : undefined}
                onClick={() => {
                  setOpen(id);
                  emit(`note:${id}`);
                }}
              >
                <strong>{n.title}</strong>
                <span>
                  {n.date} · {fill(n.body).split('\n')[0].slice(0, 26)}…
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
