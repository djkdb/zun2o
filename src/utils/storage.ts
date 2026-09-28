// Defensive wrappers around Web Storage. Private browsing modes, disabled
// storage or quota errors must never break the experience, so every call
// falls back to an in-memory map.

const memory = new Map<string, string>();

function resolve(kind: 'local' | 'session'): Storage | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__na_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

let localStore: Storage | null | undefined;
let sessionStore: Storage | null | undefined;

function getStore(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  if (kind === 'local') {
    if (localStore === undefined) localStore = resolve('local');
    return localStore;
  }
  if (sessionStore === undefined) sessionStore = resolve('session');
  return sessionStore;
}

export function readItem(key: string, kind: 'local' | 'session' = 'local'): string | null {
  const store = getStore(kind);
  try {
    if (store) return store.getItem(key);
  } catch {
    /* fall through */
  }
  return memory.get(`${kind}:${key}`) ?? null;
}

export function writeItem(key: string, value: string, kind: 'local' | 'session' = 'local'): void {
  memory.set(`${kind}:${key}`, value);
  const store = getStore(kind);
  try {
    store?.setItem(key, value);
  } catch {
    /* quota or disabled — memory copy is enough for this session */
  }
}

export function removeItem(key: string, kind: 'local' | 'session' = 'local'): void {
  memory.delete(`${kind}:${key}`);
  try {
    getStore(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function storageAvailable(): boolean {
  return getStore('local') !== null;
}
