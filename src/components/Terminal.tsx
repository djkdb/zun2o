import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { findSecret, getState, playSound, unlockEnding } from '../game/store';
import { getNow } from '../game/clock';
import { listedRecords } from '../game/secretManager';
import { CONTINUATION_KEY } from '../data/records';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { href, navigate } from '../utils/router';
import { formatClock, partsOf } from '../utils/time';

// ─────────────────────────────────────────────────────────────────────────
// SYSTEM ACCESS — the night index terminal. Lines are typed out from a
// queue; the visitor answers with the keyboard or with on-screen buttons
// (so it works on phones). Secret B completes here; the secret ending is
// reached by entering the continuation key found in Record 013.
// ─────────────────────────────────────────────────────────────────────────

type Kind = 'out' | 'dim' | 'warn' | 'err' | 'you';
interface Line {
  text: string;
  kind: Kind;
}

const BOOT: Line[] = [
  { text: 'HARROW COUNTY ANNEX — NIGHT INDEX TERMINAL v2.3 (1993)', kind: 'dim' },
  { text: 'CONNECTING TO ARCHIVE .......... OK', kind: 'dim' },
  { text: 'ACCESSING ARCHIVE...', kind: 'out' },
  { text: 'RECORDS FOUND: 17', kind: 'out' },
  { text: 'UNKNOWN FILE DETECTED: LAST_ENTRY.TXT', kind: 'warn' },
  { text: 'OPEN? [Y/N]', kind: 'out' },
];

const FILE: Line[] = [
  { text: '──── LAST_ENTRY.TXT ──── 14/03/1994 01:58 ────', kind: 'dim' },
  { text: 'If you are reading this, you found the sentence. Good.', kind: 'out' },
  { text: 'The index is longer at night because it is still being written.', kind: 'out' },
  { text: 'Every night at 02:00 it adds a record. Someone has to be here to file it.', kind: 'out' },
  { text: 'I have been here since 1994. I have filed every visitor. I filed you.', kind: 'out' },
  { text: 'I would like to go home.', kind: 'out' },
  { text: '──── END OF FILE ────', kind: 'dim' },
];

const HELP: Line[] = [
  { text: 'COMMANDS:', kind: 'dim' },
  { text: '  LIST            list index files', kind: 'out' },
  { text: '  OPEN <n>        open a record (e.g. OPEN 003)', kind: 'out' },
  { text: '  KEY <key>       submit a continuation key', kind: 'out' },
  { text: '  WHOAMI          show your card', kind: 'out' },
  { text: '  TIME            show terminal time', kind: 'out' },
  { text: '  LOGOUT          return your visitor card', kind: 'out' },
  { text: '  CLEAR           clear the screen', kind: 'out' },
];

type Phase = 'boot' | 'choice' | 'file' | 'prompt' | 'ending';

export function Terminal() {
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState<{ line: Line; chars: number } | null>(null);
  const [queue, setQueue] = useState<Line[]>(BOOT);
  const [phase, setPhase] = useState<Phase>('boot');
  const [input, setInput] = useState('');
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const afterQueue = useRef<(() => void) | null>(() => setPhase('choice'));

  const print = useCallback((next: Line[], then?: () => void) => {
    setQueue((q) => [...q, ...next]);
    afterQueue.current = then ?? null;
  }, []);

  // Typing engine: one timer at a time.
  useEffect(() => {
    if (typing) {
      if (typing.chars >= typing.line.text.length) {
        const t = setTimeout(() => {
          setLines((l) => [...l, typing.line]);
          setTyping(null);
        }, 120);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        if (typing.chars % 3 === 0) playSound('type');
        setTyping({ line: typing.line, chars: typing.chars + (reduced ? typing.line.text.length : 2) });
      }, 16);
      return () => clearTimeout(t);
    }
    if (queue.length > 0) {
      const [head, ...rest] = queue;
      const t = setTimeout(() => {
        setQueue(rest);
        setTyping({ line: head, chars: 0 });
      }, head.kind === 'dim' ? 90 : 260);
      return () => clearTimeout(t);
    }
    if (afterQueue.current) {
      const fn = afterQueue.current;
      afterQueue.current = null;
      fn();
    }
  }, [typing, queue, reduced]);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight });
  }, [lines, typing]);

  useEffect(() => {
    if (phase === 'prompt') inputRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const answer = useCallback(
    (yes: boolean) => {
      if (phase !== 'choice') return;
      setPhase('file');
      const preface: Line[] = yes ? [{ text: '> Y', kind: 'you' }] : [{ text: '> N', kind: 'you' }, { text: 'THE FILE OPENS ANYWAY.', kind: 'err' }];
      print([...preface, ...FILE, { text: 'Type HELP for commands.', kind: 'dim' }], () => {
        findSecret('B');
        setPhase('prompt');
      });
    },
    [phase, print],
  );

  // Keyboard Y/N during the choice.
  useEffect(() => {
    if (phase !== 'choice') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') answer(true);
      if (e.key === 'n' || e.key === 'N') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const [verb, ...args] = cmd.split(/\s+/);
    const v = verb.toLowerCase();
    const arg = args.join(' ');
    const save = getState().save;
    const you: Line = { text: `> ${cmd}`, kind: 'you' };
    const tryKey = (key: string) => {
      if (key.toUpperCase().replace(/\s/g, '') !== CONTINUATION_KEY) {
        playSound('error');
        print([you, { text: 'INVALID KEY.', kind: 'err' }]);
        return;
      }
      const s = getState().save;
      if (!s.secretProgress.A.found || !s.secretProgress.B.found) {
        print([you, { text: 'KEY RECOGNISED. BUT YOU HAVE NOT READ RECORD 013.', kind: 'warn' }]);
        return;
      }
      setPhase('ending');
      print(
        [
          you,
          { text: 'CONTINUATION ACCEPTED.', kind: 'warn' },
          { text: 'ASSIGNING RECORD 017 ...', kind: 'out' },
          { text: `SUBJECT: VISITOR #${String(s.visitCount).padStart(4, '0')}`, kind: 'out' },
          { text: 'FILED.', kind: 'err' },
        ],
        () =>
          setTimeout(() => {
            unlockEnding('secret');
            navigate('/ending/secret');
          }, 1400),
      );
    };

    switch (v) {
      case 'help':
      case '?':
        print([you, ...HELP]);
        break;
      case 'clear':
      case 'cls':
        setLines([]);
        break;
      case 'list':
      case 'ls':
      case 'dir': {
        const files = listedRecords(save).map<Line>((id) => ({ text: `  RECORD_${id}.DAT`, kind: 'out' }));
        print([
          you,
          ...files,
          { text: save.secretProgress.A.found ? '  RECORD_017.DAT   [PENDING — 02:00]' : '  RECORD_0??.DAT   [UNFILED]', kind: 'warn' },
          { text: '  LAST_ENTRY.TXT', kind: 'out' },
        ]);
        break;
      }
      case 'open':
      case 'cat':
      case 'type': {
        if (/last/i.test(arg)) {
          print([you, ...FILE]);
          break;
        }
        const n = arg.replace(/\D/g, '').padStart(3, '0');
        if (n === '017') {
          print([you, { text: 'OPENING RECORD 017 ...', kind: 'warn' }], () => navigate('/unknown'));
        } else if (listedRecords(save).includes(n)) {
          print([you, { text: `OPENING RECORD ${n} ...`, kind: 'out' }], () => navigate(`/record/${n}`));
        } else {
          playSound('error');
          print([you, { text: `RECORD ${n} NOT IN INDEX.`, kind: 'err' }]);
        }
        break;
      }
      case 'key':
        tryKey(arg);
        break;
      case 'whoami': {
        const card = `VISITOR #${String(save.visitCount).padStart(4, '0')}`;
        const status = save.flags.includes('ending-true') ? 'NIGHT ARCHIVIST.' : save.endingUnlocked.includes('secret') ? `${card}. ON FILE.` : `${card}. NOT STAFF.`;
        print([you, { text: status, kind: 'out' }]);
        break;
      }
      case 'time': {
        const level = getState().session.level;
        print([you, { text: level >= 5 ? '02:00:00 (STOPPED)' : formatClock(partsOf(new Date(getNow()))), kind: 'out' }]);
        break;
      }
      case 'logout':
        setPhase('ending');
        print([you, { text: 'LOGGING OUT ...', kind: 'dim' }, { text: 'VISITOR CARD RETURNED.', kind: 'out' }], () =>
          setTimeout(() => {
            unlockEnding('normal');
            navigate('/ending/normal');
          }, 1000),
        );
        break;
      case 'exit':
      case 'quit':
      case 'q':
        print([you, { text: 'THERE IS NO EXIT COMMAND. DID YOU MEAN LOGOUT?', kind: 'warn' }]);
        break;
      case 'varga':
      case 'ilse':
        print([you, { text: 'SHE IS BUSY.', kind: 'err' }]);
        break;
      case 'hello':
      case 'hi':
        print([you, { text: 'HELLO, VISITOR.', kind: 'out' }]);
        break;
      default:
        if (cmd.toUpperCase().replace(/\s/g, '') === CONTINUATION_KEY) {
          tryKey(cmd);
          break;
        }
        playSound('error');
        print([you, { text: `UNKNOWN COMMAND: ${verb.toUpperCase().slice(0, 24)}`, kind: 'err' }]);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (phase !== 'prompt' || queue.length > 0 || typing) return;
    run(input);
    setInput('');
  };

  return (
    <div className="terminal-page" role="main">
      <div className="terminal-bar">
        <span>SYSTEM ACCESS · NIGHT INDEX</span>
        <a href={href('/')}>[ disconnect ]</a>
      </div>
      <div className="terminal-screen" ref={screenRef} aria-live="polite">
        <div className="terminal-inner">
          {lines.map((l, i) => (
            <p key={i} className={`terminal-line ${l.kind}`}>
              {l.text}
            </p>
          ))}
          {typing && (
            <p className={`terminal-line ${typing.line.kind}`}>
              {typing.line.text.slice(0, typing.chars)}
              <span className="cursor" />
            </p>
          )}
          {phase === 'choice' && (
            <div className="terminal-choices">
              <button type="button" onClick={() => answer(true)} autoFocus>
                [Y]
              </button>
              <button type="button" onClick={() => answer(false)}>
                [N]
              </button>
            </div>
          )}
          {!typing && phase !== 'prompt' && phase !== 'choice' && <span className="cursor" />}
        </div>
      </div>
      <form className="terminal-form" onSubmit={submit}>
        <label htmlFor="cmd">&gt;</label>
        <input
          id="cmd"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase !== 'prompt'}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Terminal command"
          placeholder={phase === 'prompt' ? 'type HELP' : ''}
        />
      </form>
    </div>
  );
}
