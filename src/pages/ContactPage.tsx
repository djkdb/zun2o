import { useState, type FormEvent } from 'react';
import { addGuestbookEntry, unlockEnding } from '../game/store';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { navigate } from '../utils/router';
import { formatClock, partsOf } from '../utils/time';

export function ContactPage() {
  const level = useVisualLevel();
  const guestbook = useGame((s) => s.save.guestbook);
  const [text, setText] = useState('');
  const [checkout, setCheckout] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addGuestbookEntry(text);
    setText('');
  };

  const leave = () => {
    unlockEnding('normal');
    navigate('/ending/normal');
  };

  return (
    <div className="prose">
      <h2 className="page-title">{level >= 5 ? 'Leave' : 'Contact'}</h2>
      <p>
        The volunteers do not publish an email address. You are welcome to leave a note in the reading-room guestbook. Notes are
        kept on this device only and are not sent anywhere.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="note">Your note</label>
          <textarea id="note" value={text} maxLength={280} onChange={(e) => setText(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={!text.trim()}>
          Leave note
        </button>
      </form>
      {guestbook.length > 0 && (
        <ul className="guestbook" aria-label="Guestbook">
          {guestbook
            .slice()
            .reverse()
            .map((g) => (
              <li key={g.at}>
                <time>
                  {new Date(g.at).toLocaleDateString('en-GB')} {formatClock(partsOf(new Date(g.at)))} — {level >= 3 ? 'filed by I.V.' : 'filed'}
                </time>
                {g.text}
              </li>
            ))}
        </ul>
      )}
      <h3 className="section-heading">Check out</h3>
      <p>
        {level >= 5
          ? 'You can still leave. Your visitor card will be returned to the index and the lamp will be switched off.'
          : 'If you would like the archive to stop keeping your visitor card, you may check out.'}
      </p>
      {!checkout ? (
        <button type="button" className="btn" onClick={() => setCheckout(true)}>
          Check out
        </button>
      ) : (
        <p>
          Return your visitor card?{' '}
          <button type="button" className="btn" onClick={leave}>
            Yes, check out
          </button>{' '}
          <button type="button" className="text-button" onClick={() => setCheckout(false)}>
            Stay
          </button>
        </p>
      )}
    </div>
  );
}
