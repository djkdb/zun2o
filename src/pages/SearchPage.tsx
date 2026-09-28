import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { runSearch, normalize } from '../game/search';
import { emit, getState, setFlag } from '../game/store';
import { useVisualLevel } from '../hooks/useGame';
import { href } from '../utils/router';

export function SearchPage() {
  const level = useVisualLevel();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => (query ? runSearch(query, { save: getState().save, level }) : []), [query, level]);

  useEffect(() => {
    results.forEach((r) => r.revealsFlag && setFlag(r.revealsFlag));
  }, [results]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = normalize(input);
    setQuery(q);
    q.split(' ').forEach((token) => emit({ type: 'search', target: token }));
  };

  return (
    <>
      <h2 className="page-title">기록 검색</h2>
      <form className="search-form" role="search" onSubmit={submit}>
        <label htmlFor="q" className="visually-hidden">
          검색어
        </label>
        <input
          id="q"
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="이름, 장소, 번호…"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn">
          검색
        </button>
      </form>
      {query && (
        <p className="small" aria-live="polite">
          “{query}” 검색 결과 {results.length}건
        </p>
      )}
      {query && results.length === 0 && (
        <p className="prose">{level >= 3 ? '찾은 기록이 없습니다. 02:00 이후에 다시 검색해 보십시오.' : '찾은 기록이 없습니다. 기록 번호나 장소 이름으로 검색해 보세요.'}</p>
      )}
      <ul className="search-results">
        {results.map((r) => (
          <li key={r.key} className={r.corrupted ? 'corrupted' : undefined}>
            {r.href ? <a href={href(r.href)}>{r.title}</a> : <strong>{r.title}</strong>}
            <span className="rec-summary">{r.summary}</span>
          </li>
        ))}
      </ul>
      {!query && <p className="small">도움말: 번호(예: 003), 사람 이름, 장소로 기록을 찾을 수 있습니다.</p>}
    </>
  );
}
