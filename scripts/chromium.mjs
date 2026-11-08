// Where the preinstalled Chromium is. The folder name carries a build number that changes when the
// image is updated, so look it up instead of hard-coding it. CHROMIUM=… overrides.
import { existsSync, readdirSync, statSync } from 'node:fs';

function find() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  // some images ship a launcher right at <root>/chromium
  if (existsSync(`${root}/chromium`) && statSync(`${root}/chromium`).isFile()) return `${root}/chromium`;
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => /^chromium(-\d+)?$/.test(d)).sort().reverse() : [];
  for (const d of dirs)
    for (const sub of ['chrome-linux64', 'chrome-linux'])
      if (existsSync(`${root}/${d}/${sub}/chrome`)) return `${root}/${d}/${sub}/chrome`;
  return undefined; // let playwright pick its own
}

export const CHROMIUM = find();
