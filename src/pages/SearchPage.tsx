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
      <h2 className="page-title">Search the archive</h2>
      <form className="search-form" role="search" onSubmit={submit}>
        <label htmlFor="q" className="visually-hidden">
          Search terms
        </label>
        <input
          id="q"
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="name, place, number…"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>
      {query && (
        <p className="small" aria-live="polite">
          {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
        </p>
      )}
      {query && results.length === 0 && (
        <p className="prose">{level >= 3 ? 'No records found. Try again after 02:00.' : 'No records found. Try a record number or a place name.'}</p>
      )}
      <ul className="search-results">
        {results.map((r) => (
          <li key={r.key} className={r.corrupted ? 'corrupted' : undefined}>
            {r.href ? <a href={href(r.href)}>{r.title}</a> : <strong>{r.title}</strong>}
            <span className="rec-summary">{r.summary}</span>
          </li>
        ))}
      </ul>
      {!query && <p className="small">Tip: records can be found by number (e.g. 003), by name or by place.</p>}
    </>
  );
}
