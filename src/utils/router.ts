// Minimal hash router. Hash routing keeps the static build portable and
// makes "the page that shouldn't exist" URLs (#/system, #/room-02) shareable.

export interface Route {
  path: string;
  segments: string[];
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '').split('?')[0] || '/';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const segments = path.split('/').filter(Boolean);
  return { path, segments };
}

export function navigate(path: string): void {
  const target = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}

export function href(path: string): string {
  return `#${path.startsWith('/') ? path : `/${path}`}`;
}
