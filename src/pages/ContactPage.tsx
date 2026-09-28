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
      <h2 className="page-title">{level >= 5 ? '떠나기' : '연락'}</h2>
      <p>
        자원봉사자들은 이메일 주소를 공개하지 않습니다. 열람실 방명록에 메모를 남겨 주세요. 메모는 이 기기에만 저장되며 어디로도
        전송되지 않습니다.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="note">남길 메모</label>
          <textarea id="note" value={text} maxLength={280} onChange={(e) => setText(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={!text.trim()}>
          메모 남기기
        </button>
      </form>
      {guestbook.length > 0 && (
        <ul className="guestbook" aria-label="방명록">
          {guestbook
            .slice()
            .reverse()
            .map((g) => (
              <li key={g.at}>
                <time>
                  {new Date(g.at).toLocaleDateString('ko-KR')} {formatClock(partsOf(new Date(g.at)))} — {level >= 3 ? '서미령이 등록함' : '등록됨'}
                </time>
                {g.text}
              </li>
            ))}
        </ul>
      )}
      <h3 className="section-heading">퇴실</h3>
      <p>
        {level >= 5
          ? '아직 떠날 수 있습니다. 방문자 카드는 색인에 반납되고, 전등은 꺼집니다.'
          : '보관소가 더 이상 당신의 방문자 카드를 보관하지 않기를 원하신다면, 퇴실할 수 있습니다.'}
      </p>
      {!checkout ? (
        <button type="button" className="btn" onClick={() => setCheckout(true)}>
          퇴실하기
        </button>
      ) : (
        <p>
          방문자 카드를 반납할까요?{' '}
          <button type="button" className="btn" onClick={leave}>
            네, 퇴실합니다
          </button>{' '}
          <button type="button" className="text-button" onClick={() => setCheckout(false)}>
            남기
          </button>
        </p>
      )}
    </div>
  );
}
