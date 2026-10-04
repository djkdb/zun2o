// Lets `node --experimental-strip-types` load the game's content modules from scripts:
// they import each other without file extensions (`./season`, `./s2/calls`), as Vite allows.
// Only for authoring scripts (voices); the game itself is built by Vite.
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try {
    return await next(spec, ctx);
  } catch (e) {
    if (e && e.code === 'ERR_MODULE_NOT_FOUND' && spec.startsWith('.') && !/\\.[a-z]+$/i.test(spec)) {
      for (const ext of ['.ts', '.tsx']) {
        try {
          return await next(spec + ext, ctx);
        } catch {}
      }
    }
    throw e;
  }
}`),
);
