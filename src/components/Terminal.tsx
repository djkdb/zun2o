import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { emit, findSecret, getState, playSound, unlockEnding } from '../game/store';
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
  { text: '해원군청 별관 — 야간 색인 단말기 v2.3 (1993)', kind: 'dim' },
  { text: '기록보관소에 연결 중 .......... 완료', kind: 'dim' },
  { text: '기록 검색 중...', kind: 'out' },
  { text: '발견된 기록: 17건', kind: 'out' },
  { text: '알 수 없는 파일 발견: LAST_ENTRY.TXT', kind: 'warn' },
  { text: '열겠습니까? [Y/N]', kind: 'out' },
];

const FILE: Line[] = [
  { text: '──── LAST_ENTRY.TXT ──── 1994-03-14 01:58 ────', kind: 'dim' },
  { text: '이걸 읽고 있다면, 그 문장을 찾았다는 뜻이겠지. 잘했어.', kind: 'out' },
  { text: '색인이 밤에 길어지는 건, 아직도 쓰이고 있기 때문이야.', kind: 'out' },
  { text: '매일 밤 02:00이 되면 기록이 하나 늘어나. 누군가는 여기 남아서 그걸 정리해야 해.', kind: 'out' },
  { text: '나는 1994년부터 여기 있었어. 모든 방문자를 등록했지. 너도 등록했어.', kind: 'out' },
  { text: '이제 집에 가고 싶어.', kind: 'out' },
  { text: '──── 파일 끝 ────', kind: 'dim' },
];

const HELP: Line[] = [
  { text: '명령어:', kind: 'dim' },
  { text: '  LIST  (목록)          색인 파일 보기', kind: 'out' },
  { text: '  OPEN <번호> (열기)    기록 열기 (예: OPEN 003)', kind: 'out' },
  { text: '  KEY <열쇠> (열쇠)     연장 열쇠 입력', kind: 'out' },
  { text: '  WHOAMI (누구)         내 카드 보기', kind: 'out' },
  { text: '  TIME  (시간)          단말기 시각', kind: 'out' },
  { text: '  LOGOUT (퇴실)         방문자 카드 반납', kind: 'out' },
  { text: '  CLEAR (지우기)        화면 지우기', kind: 'out' },
];

type Phase = 'boot' | 'choice' | 'file' | 'prompt' | 'ending';

/** 'haewon 0200', '해원-0200' … all count as the key. */
function normalizeKey(key: string): string {
  return key.toUpperCase().replace(/\s/g, '').replace('해원', 'HAEWON').replace(/^HAEWON(\d)/, 'HAEWON-$1');
}

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
      const preface: Line[] = yes ? [{ text: '> Y', kind: 'you' }] : [{ text: '> N', kind: 'you' }, { text: '파일은 어쨌든 열립니다.', kind: 'err' }];
      print([...preface, ...FILE, { text: '명령어는 HELP 또는 도움말 을 입력하세요.', kind: 'dim' }], () => {
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
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ㅛ') answer(true);
      if (e.key === 'n' || e.key === 'N' || e.key === 'ㅜ') answer(false);
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
      if (normalizeKey(key) !== CONTINUATION_KEY) {
        playSound('error');
        print([you, { text: '잘못된 열쇠입니다.', kind: 'err' }]);
        return;
      }
      const s = getState().save;
      if (!s.secretProgress.A.found || !s.secretProgress.B.found) {
        print([you, { text: '열쇠는 맞습니다. 하지만 당신은 기록 013을 읽지 않았습니다.', kind: 'warn' }]);
        return;
      }
      setPhase('ending');
      print(
        [
          you,
          { text: '연장 승인.', kind: 'warn' },
          { text: '기록 017 배정 중 ...', kind: 'out' },
          { text: `대상: 방문자 #${String(s.visitCount).padStart(4, '0')}`, kind: 'out' },
          { text: '등록 완료.', kind: 'err' },
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
      case '도움말':
      case '도움':
      case '?':
        print([you, ...HELP]);
        break;
      case 'clear':
      case '지우기':
      case 'cls':
        setLines([]);
        break;
      case 'list':
      case '목록':
      case 'ls':
      case 'dir': {
        const files = listedRecords(save).map<Line>((id) => ({ text: `  RECORD_${id}.DAT`, kind: 'out' }));
        print([
          you,
          ...files,
          { text: save.secretProgress.A.found ? '  RECORD_017.DAT   [대기 중 — 02:00]' : '  RECORD_0??.DAT   [미등록]', kind: 'warn' },
          { text: '  LAST_ENTRY.TXT', kind: 'out' },
        ]);
        break;
      }
      case 'open':
      case '열기':
      case 'cat':
      case 'type': {
        if (/last|마지막/i.test(arg)) {
          print([you, ...FILE]);
          break;
        }
        const n = arg.replace(/\D/g, '').padStart(3, '0');
        if (n === '017') {
          print([you, { text: '기록 017 여는 중 ...', kind: 'warn' }], () => navigate('/unknown'));
        } else if (listedRecords(save).includes(n)) {
          print([you, { text: `기록 ${n} 여는 중 ...`, kind: 'out' }], () => navigate(`/record/${n}`));
        } else {
          playSound('error');
          print([you, { text: `기록 ${n}은(는) 색인에 없습니다.`, kind: 'err' }]);
        }
        break;
      }
      case 'key':
      case '열쇠':
      case '키':
        tryKey(arg);
        break;
      case 'whoami':
      case '누구':
      case '나': {
        const card = `방문자 #${String(save.visitCount).padStart(4, '0')}`;
        const status = save.flags.includes('ending-true') ? '야간 기록사.' : save.endingUnlocked.includes('secret') ? `${card}. 등록되어 있음.` : `${card}. 직원 아님.`;
        print([you, { text: status, kind: 'out' }]);
        break;
      }
      case 'time':
      case '시간': {
        const level = getState().session.level;
        print([you, { text: level >= 5 ? '02:00:00 (멈춤)' : formatClock(partsOf(new Date(getNow()))), kind: 'out' }]);
        break;
      }
      case 'logout':
      case '퇴실':
      case '로그아웃':
        setPhase('ending');
        print([you, { text: '로그아웃 중 ...', kind: 'dim' }, { text: '방문자 카드가 반납되었습니다.', kind: 'out' }], () =>
          setTimeout(() => {
            unlockEnding('normal');
            navigate('/ending/normal');
          }, 1000),
        );
        break;
      case 'exit':
      case '나가기':
      case '종료':
      case 'quit':
      case 'q':
        print([you, { text: '나가는 명령어는 없습니다. 퇴실(LOGOUT)을 말씀하신 건가요?', kind: 'warn' }]);
        break;
      case 'varga':
      case '서미령':
      case '미령':
      case '서':
        print([you, { text: '그녀는 지금 바쁩니다.', kind: 'err' }], () => setTimeout(() => emit({ type: 'command', target: 'varga' }), 900));
        break;
      case 'hello':
      case '안녕':
      case '안녕하세요':
      case 'hi':
        print([you, { text: '안녕하세요, 방문자님.', kind: 'out' }]);
        break;
      default:
        if (normalizeKey(cmd) === CONTINUATION_KEY) {
          tryKey(cmd);
          break;
        }
        playSound('error');
        print([you, { text: `알 수 없는 명령어: ${verb.toUpperCase().slice(0, 24)}  (도움말 을 입력해 보세요)`, kind: 'err' }]);
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
        <span>시스템 접속 · 야간 색인</span>
        <a href={href('/')}>[ 연결 끊기 ]</a>
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
                [Y] 예
              </button>
              <button type="button" onClick={() => answer(false)}>
                [N] 아니오
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
          autoCapitalize="off"
          spellCheck={false}
          aria-label="단말기 명령어"
          placeholder={phase === 'prompt' ? '도움말 입력' : ''}
        />
      </form>
    </div>
  );
}
