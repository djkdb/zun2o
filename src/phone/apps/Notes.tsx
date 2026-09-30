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
          <small className="note-date">{note.date}</small>
          <h2>{note.title}</h2>
          <NoteText text={fill(note.body)} />
        </article>
      </div>
    );
  }
  return (
    <div className="notes-app">
      <AppHeader title="" onBack={() => openApp(null)} backLabel="홈" />
      <div className="note-top">
        <h1>메모</h1>
        <p>메모 {ids.length}개</p>
        <div className="note-search" aria-hidden="true">
          <span>⌕</span> 검색
        </div>
      </div>
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
                <strong>
                  {n.title}
                  {id === 'n4' && <i className="note-dot" aria-label="새 메모" />}
                </strong>
                <span>
                  <em>{n.date}</em> {fill(n.body).split('\n')[0].slice(0, 30)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A note's body the way a notes app shows it: bullets, arrows indented, blank lines as space. */
function NoteText({ text }: { text: string }) {
  return (
    <div className="note-text">
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="note-gap" />;
        if (t.startsWith('- ')) return <p key={i} className="note-bullet">{t.slice(2)}</p>;
        if (t.startsWith('→')) return <p key={i} className="note-arrow">{t.slice(1).trim()}</p>;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

