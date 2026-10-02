import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useGame } from '../hooks/useGame';
import { reachEnding, sfx, vibrate } from '../engine/director';
import { getState, setSave } from '../engine/state';

// 시즌 2 — 02:00. The notebook fills the screen: her mother's hand has written
// "9월 28일 02:00 — 한소" and stopped, one character short. The record says what
// it knows about you, then you choose: watch, write your own name, or erase the copy.

type Step = 'page' | 'recall' | 'choice' | 'sign' | 'erase';

const HAND = "'Nanum Pen Script', 'IBM Plex Sans KR', cursive";
const WRITTEN = '9월 28일 02:00 — 한소';

function buildRecall(): string[] {
  const s = getState().save;
  const lines = ['02:00. 어머니 손이 멈췄어요. 한 글자 남았어요.'];
  // last year: only ending 3 called her name; anyone else just came and went
  if (s.s1?.name) lines.push(s.s1.endings.includes('release') ? `${s.s1.name} 씨. 작년엔 어머니 이름 불러 줬잖아요.` : `${s.s1.name} 씨. 작년에도 여기 있었죠.`);
  if (s.flags.includes('pretended')) lines.push('어머니한테 소연 씨인 척했죠. 어머니는 감기 걸렸냐고만 했어요.');
  if (s.flags.includes('told-truth')) lines.push('어머니한테 사실대로 말했죠. 그 뒤로 어머니 손만 움직였어요.');
  if (s.flags.includes('promised')) lines.push('소연 씨한테 지운다고 했죠. 기다리고 있어요.');
  if (s.flags.includes('asked-her')) lines.push('소연 씨한테 정말 남을 거냐고 물었죠. 무섭대요.');
  lines.push(s.flags.includes('copy-armed') ? '삭제 예약돼 있어요. 지우면 끝나요. 어머니도요.' : '사본은 그대로예요.');
  lines.push('누구든 적히면 도현 씨는 나와요.');
  return lines;
}

function useTyped(lines: string[], active: boolean, speed = 36): string[] {
  const [n, setN] = useState(0);
  const total = lines.reduce((a, l) => a + l.length + 8, 0);
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setN((x) => (x >= total ? x : x + 1)), speed);
    return () => clearInterval(iv);
  }, [active, total, speed]);
  const out: string[] = [];
  let left = n;
  for (const l of lines) {
    if (left <= 0) break;
    out.push(l.slice(0, left));
    left -= l.length + 8;
  }
  return out;
}

export function Finale2() {
  const save = useGame((s) => s.save);
  const [step, setStep] = useState<Step>('page');
  // the line arrives already mostly written: only the last few characters are watched
  const [ink, setInk] = useState(Math.max(0, WRITTEN.length - 6));
  const [recall] = useState(buildRecall);
  const [name, setName] = useState(save.playerName ?? save.s1?.name ?? '');
  const reveal = useRef<HTMLElement>(null);

  // The page: the hand writes what's left of the line, one character at a time, and stops.
  useEffect(() => {
    if (step !== 'page') return;
    sfx('thud');
    const start = Math.max(0, WRITTEN.length - 6);
    const ts: ReturnType<typeof setTimeout>[] = [];
    for (let i = start + 1; i <= WRITTEN.length; i++) ts.push(setTimeout(() => (setInk(i), sfx('key')), 600 + (i - start) * 520));
    ts.push(setTimeout(() => (vibrate([40]), setStep('recall')), 600 + (WRITTEN.length - start) * 520 + 2600));
    return () => ts.forEach(clearTimeout);
  }, [step]);

  const typed = useTyped(recall, step === 'recall');
  const done = typed.length === recall.length && typed[typed.length - 1] === recall[recall.length - 1];
  useEffect(() => {
    if (step === 'recall' && done) {
      const t = setTimeout(() => setStep('choice'), 900);
      return () => clearTimeout(t);
    }
  }, [step, done]);
  // the choices come into view under the recall text
  useEffect(() => {
    if (step === 'choice' || step === 'sign' || step === 'erase') setTimeout(() => reveal.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 80);
  }, [step]);

  const armed = save.flags.includes('copy-armed');
  const sign = (e: FormEvent) => {
    e.preventDefault();
    const n = name.replace(/[<>{}]/g, '').trim().slice(0, 12);
    if (!n) return;
    // the name on the page is the one the ending will say
    setSave({ playerName: n });
    sfx('thud');
    vibrate([200]);
    reachEnding('s2-instead');
  };

  return (
    <div className={`finale2 step-${step}`}>
      <div className="finale2-clock">{step === 'page' ? '01:59' : '02:00'}</div>
      <div className="nb-sheet" aria-label={`노트: ${WRITTEN.slice(0, ink)}`}>
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect width="360" height="150" fill="#efe7d4" />
          {[48, 82, 116].map((y) => (
            <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="#9fb4cc" strokeWidth="0.8" opacity="0.7" />
          ))}
          <line x1="34" x2="34" y1="0" y2="150" stroke="#d27a7a" strokeWidth="1" opacity="0.7" />
          {/* written in pencil beforehand; at two her pen goes over it */}
          <text x="44" y="74" fontFamily={HAND} fontSize="27" fill="#6b6f7a" opacity="0.45">
            {WRITTEN}연
          </text>
          <text x="44" y="74" fontFamily={HAND} fontSize="27" fill="#24252e">
            {WRITTEN.slice(0, ink)}
          </text>
          {step !== 'page' && <rect className="nb-pen" x={44 + ink * 11.4} y="52" width="2" height="26" fill="#24252e" />}
        </svg>
      </div>
      {step !== 'page' && (
        <div className="final-recall finale2-recall">
          {(step === 'recall' ? typed : recall).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          {step === 'choice' && (
            <div className="final-choices" ref={reveal as React.RefObject<HTMLDivElement>}>
              <p className="final-choices-title">하나만 고를 수 있어요</p>
              <button type="button" onClick={() => (sfx('thud'), reachEnding('s2-daughter'))}>
                <b>지켜본다</b>
                <small>어머니의 손이 마지막 글자를 쓴다. 소연이 남는다.</small>
              </button>
              <button type="button" onClick={() => setStep('sign')}>
                <b>내 이름을 쓴다</b>
                <small>“한소” 위에 줄을 긋고, 그 아래에 내 이름을. 소연 대신 내가 남는다.</small>
              </button>
              <button type="button" disabled={!armed} onClick={() => setStep('erase')}>
                <b>사본을 지운다</b>
                <small>{armed ? '예약된 삭제를 실행한다. 기록이 끝난다. 어머니도.' : '삭제 예약이 없다 (보관소 관리 → 기록 013 사본).'}</small>
              </button>
            </div>
          )}
          {step === 'sign' && (
            <form className="final-form" onSubmit={sign} ref={reveal as React.RefObject<HTMLFormElement>}>
              <label htmlFor="s2n">노트에 쓸 이름</label>
              <input id="s2n" autoFocus value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              <button type="submit">쓴다</button>
              <button type="button" className="final-back" onClick={() => setStep('choice')}>
                …아직은
              </button>
            </form>
          )}
          {step === 'erase' && (
            <div className="final-form" ref={reveal as React.RefObject<HTMLDivElement>}>
              <p className="final-label">정말 지울까요? 이 사이트의 마지막 사본입니다. 되돌릴 수 없습니다.</p>
              <button type="button" onClick={() => (sfx('ending'), reachEnding('s2-home'))}>
                지운다
              </button>
              <button type="button" className="final-back" onClick={() => setStep('choice')}>
                …아직은
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
