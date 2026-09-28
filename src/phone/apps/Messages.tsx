import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useGame } from '../../hooks/useGame';
import { choose, openApp, openThread } from '../../engine/director';
import { THREAD_META, THREAD_ORDER } from '../../content/threads';
import type { ThreadId } from '../../engine/types';
import { AppHeader } from '../AppHeader';

function ThreadList() {
  const threads = useGame((s) => s.save.threads);
  const unread = useGame((s) => s.save.unread);
  const typing = useGame((s) => s.rt.typing);
  const choice = useGame((s) => s.save.choice);
  const order = [...THREAD_ORDER].sort((a, b) => (unread[b] > 0 ? 1 : 0) - (unread[a] > 0 ? 1 : 0));
  return (
    <div className="messages">
      <AppHeader title="메시지" onBack={() => openApp(null)} backLabel="홈" />
      <ul className="thread-list">
        {order.map((th) => {
          const meta = THREAD_META[th];
          const last = threads[th][threads[th].length - 1];
          const waiting = choice?.thread === th;
          return (
            <li key={th}>
              <button type="button" className="thread-row" onClick={() => openThread(th)}>
                <span className="avatar" style={{ background: meta.color }}>
                  {meta.avatar}
                </span>
                <span className="thread-mid">
                  <strong>{meta.name}</strong>
                  <span className="thread-last">{typing[th] ? '입력 중…' : waiting ? '답장을 기다리고 있습니다' : last?.text}</span>
                </span>
                <span className="thread-right">
                  <span className="thread-time">{last?.time}</span>
                  {(unread[th] > 0 || waiting) && <span className="badge small">{unread[th] || '!'}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Chat({ th }: { th: ThreadId }) {
  const msgs = useGame((s) => s.save.threads[th]);
  const typing = useGame((s) => !!s.rt.typing[th]);
  const choice = useGame((s) => (s.save.choice?.thread === th ? s.save.choice : null));
  const draft = useGame((s) => (s.rt.draft?.th === th ? s.rt.draft.text : null));
  const endRef = useRef<HTMLDivElement>(null);
  const [nameMode, setNameMode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const meta = THREAD_META[th];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [msgs.length, typing, choice]);

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameMode || !name.trim()) return;
    choose(nameMode, name);
    setNameMode(null);
    setName('');
  };

  const dayHeaders: (string | null)[] = [];
  let prevDay: string | undefined;
  for (const m of msgs) {
    dayHeaders.push(m.day && m.day !== prevDay ? m.day : null);
    if (m.day) prevDay = m.day;
  }
  return (
    <div className="chat">
      <AppHeader
        title={meta.name}
        subtitle={th === 'unknown' ? '알 수 없는 번호' : th === 'self' ? '나와의 채팅' : undefined}
        onBack={() => openThread(null)}
        backLabel="메시지"
      />
      <div className={`chat-body${th === 'unknown' ? ' chat-unknown' : ''}`}>
        {msgs.map((m, i) => {
          return (
            <div key={m.id}>
              {dayHeaders[i] && <div className="chat-day">{dayHeaders[i]}</div>}
              <div className={`bubble-row ${m.from}`}>
                <div className={`bubble ${m.from}`}>{m.text}</div>
                <span className="bubble-time">{m.time}</span>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className={`bubble-row ${th === 'self' ? 'me' : 'them'}`}>
            <div className={`bubble ${th === 'self' ? 'me' : 'them'} typing`} aria-label="입력 중">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {choice && !nameMode && (
        <div className="choices" role="group" aria-label="답장 선택">
          {choice.options.map((o) => (
            <button key={o.id} type="button" className="choice" onClick={() => (o.input ? setNameMode(o.id) : choose(o.id))}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {nameMode && (
        <form className="name-form" onSubmit={submitName}>
          <input
            autoFocus
            value={name}
            maxLength={12}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 (이 기기에만 저장됩니다)"
            aria-label="이름"
          />
          <button type="submit" disabled={!name.trim()}>
            보내기
          </button>
        </form>
      )}
      {!choice && !nameMode && draft !== null && (
        <div className="chat-draft" aria-live="polite">
          {draft}
          <span className="caret" />
        </div>
      )}
      {!choice && !nameMode && draft === null && (
        <div className="chat-input-disabled">{th === 'dohyun' || th === 'mom' ? '메시지를 보낼 수 없습니다 (네트워크 없음)' : '　'}</div>
      )}
    </div>
  );
}

export function MessagesApp() {
  const thread = useGame((s) => s.rt.thread);
  return thread ? <Chat th={thread} /> : <ThreadList />;
}
