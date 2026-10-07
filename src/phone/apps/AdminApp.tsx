import { useState, type FormEvent } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx, vibrate } from '../../engine/director';
import { addFlag, logInput, setRt } from '../../engine/state';
import { ARCHIVE, plain } from '../../content/archive';

// 시즌 2 — "보관소 관리": 소연's admin page for the 심야 기록보관소, still logged in.
// The waiting list for 02:00, the last copy of record 013, and the letter she didn't finish.

const PASSWORD = '0928'; // the day 엄마 came home
/**
 * Where the record starts: the missing-person report, and the first thing said in it —
 * eleven-year-old 소연 at the police station. "2시" counts as "두 시"; small slips are fine.
 */
const norm = (t: string) =>
  t
    .replace(/[\s.,!?·…'"“”‘’「」()~]/g, '')
    .replace(/2시/g, '두시')
    .replace(/(\d|두)시전엔/g, '두시전에는');
const isFirst = (t: string) => {
  const n = norm(t).replace(/전에는/g, '전에');
  return n.includes('두시전에온다고') || n.includes('두시전에온댔') || n.includes('두시전에온다했');
};
/** The trap: her mother's text tonight says it the other way round. */
const isMothers = (t: string) => /두시전에는?집에오라/.test(norm(t));

function untilTwo(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  const now = h * 60 + m;
  return now >= 12 * 60 ? 24 * 60 - now + 120 : Math.max(0, 120 - now);
}

export function AdminApp() {
  const unlocked = useGame((s) => s.save.flags.includes('admin'));
  return unlocked ? <Dashboard /> : <Login />;
}

function Login() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);
  const press = (d: string) => {
    if (code.length >= 4) return;
    sfx('key');
    const next = code + d;
    setCode(next);
    if (next.length < 4) return;
    setTimeout(() => {
      if (next === PASSWORD) {
        sfx('unlock');
        logInput('보관소 관리 비번 0928');
        addFlag('admin');
        emit('admin:unlock');
      } else {
        sfx('error');
        vibrate([60, 30, 60]);
        logInput(`보관소 관리 비번 ${next} — 틀림`);
        setErr(true);
      }
      setCode('');
    }, 160);
  };
  return (
    <div className="admin admin-login">
      <div className="admin-bar">
        <button type="button" className="index-back" onClick={() => openApp(null)}>
          ‹ 닫기
        </button>
        <span>nightarchive.or.kr/admin</span>
      </div>
      <div className="admin-logo">夜</div>
      <h2>심야 기록보관소 관리자</h2>
      <p className="admin-who">한소연 · 자동 로그인이 만료되었습니다</p>
      <p className="admin-hint">비밀번호 (숫자 4자리)</p>
      <div className="lock-dots dark">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < code.length ? 'on' : ''} />
        ))}
      </div>
      {err && <p className="album-lock-err">비밀번호가 틀렸습니다</p>}
      <div className="keypad dark">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} type="button" className={k === '⌫' ? 'key-del' : 'key'} aria-label={k === '⌫' ? '지우기' : k} onClick={() => (k === '⌫' ? setCode((c) => c.slice(0, -1)) : press(k))}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const clock = useGame((s) => s.save.clock);
  const chapter = useGame((s) => s.save.chapter);
  const name = useGame((s) => s.save.playerName);
  const s1 = useGame((s) => s.save.s1);
  // did last year end with her name being called (ending 3)?
  const calledHer = !!s1?.endings.includes('release');
  const [reread, setReread] = useState(false);
  const [near, setNear] = useState(false);
  const armed = useGame((s) => s.save.flags.includes('copy-armed'));
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(0);
  const [draft, setDraft] = useState(false);

  const queue: { no: number; who: string; why: string; you?: boolean; first?: boolean }[] = [
    { no: 1, who: '한소연', why: '자원 · 관리자가 직접 맨 위로 옮김 (22:20)', first: true },
    { no: 2, who: '윤채원', why: '작년 기록 013 열람' },
    ...(s1 ? [{ no: 3, who: `방문자 #0027 ${s1.name ?? '(이름 없음)'}`, why: calledHer ? '작년 기록 013 열람 · 이름을 불러 준 사람' : '작년 기록 013 열람' }] : []),
    { no: s1 ? 4 : 3, who: name ?? '방문자 #0028', why: '지금 이 페이지를 보는 사람', you: true },
  ];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    logInput(`사본 삭제 요청 "${text.trim().slice(0, 30)}"`);
    if (isFirst(text)) {
      sfx('vault');
      addFlag('copy-armed');
      emit('admin:armed');
      setAsking(false);
      setRt({ engaged: false });
    } else {
      sfx('error');
      vibrate([80]);
      setNear(isMothers(text));
      setWrong((n) => n + 1);
      emit('admin:wrong');
    }
    setText('');
  };

  const left = untilTwo(clock);
  return (
    <div className="admin">
      <div className="admin-bar">
        <button type="button" className="index-back" onClick={() => openApp(null)}>
          ‹ 닫기
        </button>
        <span>nightarchive.or.kr/admin</span>
      </div>
      <header className="admin-head">
        <span className="admin-logo small">夜</span>
        <div>
          <h2>관리자 · 한소연</h2>
          <p>
            지금 이 사이트를 보는 사람 <b className="arc-blink">{chapter >= 4 ? 3 : 2}</b> · 02:00까지 <b>{left === 0 ? '지금' : `${left}분`}</b>
          </p>
        </div>
      </header>

      <section className="admin-box">
        <h3>대기 명단 — 02:00 기록 예정 1명</h3>
        <ol className="admin-queue">
          {queue.map((q) => (
            <li key={q.no} className={`${q.first ? 'first' : ''}${q.you ? ' you' : ''}`}>
              <span className="admin-no">{q.no}</span>
              <span className="admin-name">{q.who}</span>
              <small>{q.why}</small>
            </li>
          ))}
        </ol>
        <p className="admin-note">맨 위부터 적힙니다.</p>
      </section>

      <section className="admin-box">
        <h3>기록 013 (사본)</h3>
        <p className="admin-row">
          <span>상태</span>
          <b className={armed ? 'armed' : 'locked'}>{armed ? '삭제 예약됨 · 02:00 실행' : '보존 중 · 이 사이트의 마지막 사본'}</b>
        </p>
        {!armed && !asking && (
          <>
            <p className="admin-warn">관리자 계정으로는 삭제할 수 없습니다. 이 기록을 시작한 사람입니다 (기록 003 · 신고자).</p>
            <button type="button" className="admin-btn" onClick={() => (sfx('click'), setAsking(true))}>
              다른 사람이 대신 삭제 요청
            </button>
          </>
        )}
        {!armed && asking && (
          <form className="admin-form" onSubmit={submit}>
            <label htmlFor="first">확인: 이 기록을 시작한 말을 입력하세요. 실종 신고서에서 신고자가 한 말입니다.</label>
            <textarea
              id="first"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              // while you type, the night holds its pop-ups
              onFocus={() => setRt({ engaged: true })}
              onBlur={() => setRt({ engaged: false })}
              autoComplete="off"
            />
            {wrong > 0 && (
              <p className="final-err">
                {near ? '어머니가 오늘 보낸 문자와 같습니다. 이 기록의 첫 문장이 아닙니다.' : '첫 문장이 아닙니다.'}
                {wrong >= 2 && !near ? ' 이 기록은 실종 신고에서 시작되었습니다.' : ''}
              </p>
            )}
            <button type="button" className="admin-draft-btn" onClick={() => (sfx('click'), setReread((v) => !v))} aria-expanded={reread}>
              {reread ? '기록 003 닫기' : '기록 003 (실종 신고) 다시 보기'}
            </button>
            {reread && (
              <div className="admin-draft">
                {ARCHIVE.r003.lines.map((l) => (
                  <p key={l}>{plain(l)}</p>
                ))}
              </div>
            )}
            <div className="admin-actions">
              <button type="submit" className="admin-btn">
                요청
              </button>
              <button type="button" className="final-back" onClick={() => setAsking(false)}>
                취소
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="admin-box">
        <h3>방명록 — 임시 저장된 글 1</h3>
        {!draft ? (
          <button type="button" className="admin-draft-btn" onClick={() => (sfx('click'), setDraft(true), emit('admin:draft'))}>
            “두 시 전에…” · 9월 27일 22:49 · 한소연
          </button>
        ) : (
          <div className="admin-draft">
            <p>두 시 전에, 기록 013 사본을 지워 주세요.</p>
            <p>저는 못 지워요. 그 기록의 첫 줄이 제 말이라서요. 열한 살 때 경찰서에서 한 말이요. 실종 신고서에 그대로 남아 있어요.</p>
            <p>지우면 엄마도</p>
            <p>채원이한테는 못 시켜요. 평생 저를 볼 사람이잖아요. 엄마를 지운 사람 얼굴은 모르고 싶어요.</p>
            <p>아니에요. 그냥 지워 주세요. 엄마는 1년 동안 집에 있었어요. 그걸로 됐다고 할게요. 할 수 있어요.</p>
            <p className="admin-draft-end">(저장되지 않은 글)</p>
          </div>
        )}
      </section>
    </div>
  );
}
