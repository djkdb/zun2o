import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useGame } from '../../hooks/useGame';
import { choose, emit, openApp, openAttach, openThread, sendText, teaseTyping } from '../../engine/director';
import { dayLabel, lastSent, threadMeta, threadOrder, timeline } from '../../content/threads';
import { isS2 } from '../../content/season';
import type { Attach, ThreadId } from '../../engine/types';
import { MEMO_TITLES, photos } from '../../content/media';
import { PhotoView } from './Gallery';
import { AppHeader } from '../AppHeader';
import { Avatar } from '../Avatar';
import { setRt } from '../../engine/state';

function ThreadList() {
  const threads = useGame((s) => s.save.threads);
  const unread = useGame((s) => s.save.unread);
  const typing = useGame((s) => s.rt.typing);
  const choice = useGame((s) => s.save.choice);
  // Newest conversation on top, like a real phone.
  const order = [...threadOrder()].sort((a, b) => lastSent(threads[b]) - lastSent(threads[a]));
  return (
    <div className="messages">
      <AppHeader title="메시지" onBack={() => openApp(null)} backLabel="홈" large />
      <ul className="thread-list">
        {order.map((th) => {
          const meta = threadMeta()[th];
          const last = threads[th][threads[th].length - 1];
          const waiting = choice?.thread === th;
          return (
            <li key={th}>
              <button type="button" className="thread-row" onClick={() => openThread(th)}>
                {/* unread: iMessage's blue dot */}
                <i className={`thread-dot${unread[th] > 0 || waiting ? ' on' : ''}`} aria-label={unread[th] > 0 ? `읽지 않은 메시지 ${unread[th]}개` : waiting ? '답장 대기' : undefined} />
                <Avatar th={th} />
                <span className="thread-mid">
                  <span className="thread-head">
                    <strong>{meta.name}</strong>
                    <span className="thread-time">
                      {last?.time}
                      <svg viewBox="0 0 8 14" aria-hidden="true">
                        <path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                  <span className="thread-last">{typing[th] ? '입력 중…' : waiting ? '답장을 기다리고 있습니다' : last?.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A shared photo / recording / link: the bridge from a chat to the thing it talks about. */
function AttachCard({ a }: { a: Attach }) {
  const albumOpen = useGame((s) => s.save.flags.includes('album-open'));
  if (a.kind === 'photo') {
    const what = photos().find((p) => p.id === a.id)?.video ? '동영상' : '사진';
    return (
      <button type="button" className="attach attach-photo" onClick={() => openAttach(a)} aria-label={`${what} 열기`}>
        <PhotoView id={a.id} />
        <span className="attach-cap">{what} · 탭해서 열기</span>
      </button>
    );
  }
  if (a.kind === 'memo')
    return (
      <button type="button" className="attach attach-memo" onClick={() => openAttach(a)}>
        <span className="attach-play">▶</span>
        <span>
          <strong>{MEMO_TITLES[a.id] ?? '녹음'}</strong>
          <small>녹음 · 탭해서 듣기</small>
        </span>
      </button>
    );
  return (
    <button type="button" className="attach attach-link" onClick={() => openAttach(a)}>
      <span className="attach-icon">{a.kind === 'album' ? (albumOpen ? '▦' : '🔒') : '夜'}</span>
      <span>
        <strong>{a.kind === 'album' ? '숨김 앨범' : '심야 기록보관소'}</strong>
        <small>{a.kind === 'album' ? (albumOpen ? '사진 5장' : '사진 · 암호 필요') : 'nightarchive.or.kr'}</small>
      </span>
    </button>
  );
}

function Composer({ th }: { th: ThreadId }) {
  const [text, setText] = useState('');
  const offline = th === 'dohyun' || th === 'mom';
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendText(th, text);
    setText('');
  };
  return (
    <form className="composer" onSubmit={send}>
      <span className="composer-plus" aria-hidden="true">
        +
      </span>
      <input
        value={text}
        maxLength={80}
        onChange={(e) => {
          // only that you started typing — never what
          if (!text && e.target.value && th === 'unknown') emit('typing:unknown');
          setText(e.target.value);
        }}
        placeholder={offline ? '메시지 (네트워크 불안정)' : '메시지 입력'}
        aria-label="메시지 입력"
        autoComplete="off"
        enterKeyHint="send"
        onFocus={() => setRt({ engaged: true })}
        onBlur={() => setRt({ engaged: false })}
      />
      <button type="submit" disabled={!text.trim()} aria-label="보내기">
        ↑
      </button>
    </form>
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
  const meta = threadMeta()[th];
  const insideName = isS2() ? '소연' : '채원';

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [msgs.length, typing, choice]);

  // Sit in the chat without writing and someone starts typing back… then stops.
  useEffect(() => {
    if (th !== 'unknown' && th !== 'self') return;
    const t = setTimeout(() => teaseTyping(th), 20000);
    return () => clearTimeout(t);
  }, [th, msgs.length]);

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameMode || !name.trim()) return;
    choose(nameMode, name);
    setNameMode(null);
    setName('');
  };

  // A date line wherever the day changes — including past midnight tonight.
  const days = timeline(msgs).map((t) => t.day);
  // Under your last message, like iMessage: 읽음 — the number with no name reads everything at once.
  let lastMine = -1;
  msgs.forEach((m, i) => {
    if (m.from === 'me' && !m.inside) lastMine = i;
  });
  const receipt = lastMine < 0 || msgs[lastMine].failed || th === 'self' ? null : th === 'unknown' ? `읽음 ${msgs[lastMine].time}` : '전송됨';
  const dayHeaders = days.map((d, i) => (i === 0 || d !== days[i - 1] ? dayLabel(d) : null));
  return (
    <div className="chat">
      <AppHeader
        title={meta.name}
        subtitle={th === 'self' ? '나와의 채팅' : undefined}
        onBack={() => openThread(null)}
        backLabel="메시지"
        avatar={<Avatar th={th} size={46} />}
      />
      <div className={`chat-body${th === 'unknown' ? ' chat-unknown' : ''}`}>
        {msgs.map((m, i) => {
          // 채원 (or 소연) writing to 나에게 from inside: on the left, labelled, so it never reads as you
          const side = m.inside ? 'them inside' : m.from;
          const label = m.inside && !msgs[i - 1]?.inside;
          // the tail goes on the last bubble of a run, like iMessage
          const next = msgs[i + 1];
          const tail = !next || dayHeaders[i + 1] || (next.inside ? 'them inside' : next.from) !== side;
          return (
            <div key={m.id}>
              {dayHeaders[i] && <div className="chat-day">{dayHeaders[i]}</div>}
              {label && <div className="bubble-who">{insideName} · 안에서</div>}
              <div className={`bubble-row ${side}${m.attach ? ' has-attach' : ''}`}>
                <div className={`bubble ${side}${m.failed ? ' failed' : ''}${tail && !m.attach ? ' tail' : ''}`}>
                  {m.text}
                  {m.attach && <AttachCard a={m.attach} />}
                </div>
                <span className="bubble-time">{m.failed ? <span className="send-failed">전송 실패 !</span> : m.time}</span>
              </div>
              {i === lastMine && receipt && <div className="bubble-receipt">{receipt}</div>}
            </div>
          );
        })}
        {typing && (
          <div className={`bubble-row them${th === 'self' ? ' inside' : ''}`}>
            <div className={`bubble them${th === 'self' ? ' inside' : ''} typing`} aria-label="입력 중">
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
            placeholder="이름 (이 기기에만 저장 · 게임 화면에 나옵니다)"
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
      {!choice && !nameMode && draft === null && <Composer th={th} />}
    </div>
  );
}

export function MessagesApp() {
  const thread = useGame((s) => s.rt.thread);
  return thread ? <Chat th={thread} /> : <ThreadList />;
}
