import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp } from '../../engine/director';
import { fill } from '../../engine/state';
import { NOTES, type NoteItem } from '../../content/media';
import { AppHeader } from '../AppHeader';

/** Season 2: the note nobody here is writing. Its text grows a character at a time (director 'write'). */
const liveNote = (body: string): NoteItem => ({ id: 'live', title: '9월 28일', date: '지금 작성 중', body });

export function NotesApp() {
  const ids = useGame((s) => s.save.notes);
  const live = useGame((s) => s.save.liveNote ?? '');
  const [open, setOpen] = useState<string | null>(null);
  // Re-render when the name changes so n4 stays current.
  useGame((s) => s.save.playerName);
  const noteOf = (id: string) => (id === 'live' ? liveNote(live) : NOTES[id]);

  if (open) {
    const note = noteOf(open);
    return (
      <div className="notes-app">
        <AppHeader title="메모" onBack={() => setOpen(null)} backLabel="목록" />
        <article className={`note-body${open === 'live' ? ' note-live' : ''}`}>
          <small className="note-date">{note.date}</small>
          <h2>{note.title}</h2>
          <NoteText text={fill(note.body)} />
          {open === 'live' && <span className="note-cursor" aria-hidden="true" />}
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
          const n = noteOf(id);
          return (
            <li key={id}>
              <button
                type="button"
                className={id === 'n4' || id === 'live' ? 'new' : undefined}
                onClick={() => {
                  setOpen(id);
                  emit(`note:${id}`);
                }}
              >
                <strong>
                  {n.title}
                  {(id === 'n4' || id === 'live') && <i className="note-dot" aria-label="새 메모" />}
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

