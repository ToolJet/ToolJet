#!/usr/bin/env node
// Publishes a built pack (dist/ from build.mjs) as a revision of its custom-component library, through the same API
// `tooljet library publish` uses. The library is found or created by the pack's correlationId (.tooljet/config.json).
//
//   TOOLJET_URL=http://localhost:3000 TOOLJET_PAT=... node packages/pack-tools/publish.mjs <packDir> <version> [message]
import fs from 'node:fs';
import path from 'node:path';

const [packArg, version, message] = process.argv.slice(2);
const packDir = path.resolve(packArg || '.');
const url = process.env.TOOLJET_URL;
const token = process.env.TOOLJET_PAT;
if (!url || !token || !version) throw new Error('usage: TOOLJET_URL=... TOOLJET_PAT=... publish.mjs <packDir> <version> [message]');
const { libraryName, correlationId } = JSON.parse(fs.readFileSync(path.join(packDir, '.tooljet/config.json'), 'utf8'));
const auth = { Authorization: `Bearer ${token}` };

const ok = async (res, what) => {
  const text = await res.text();
  if (!res.ok) throw new Error(`${what} failed (${res.status}): ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
};

const library = await ok(
  await fetch(`${url}/api/custom-component-libraries/find-or-create`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ correlationId, name: libraryName }),
  }),
  'find-or-create library'
);

const dist = path.join(packDir, 'dist');
const form = new FormData();
const file = (name, type) => new Blob([fs.readFileSync(path.join(dist, name))], { type });
form.append('bundle', file('index.js', 'application/javascript'), 'index.js');
form.append('manifest', file('manifest.json', 'application/json'), 'manifest.json');
if (fs.existsSync(path.join(dist, 'index.css'))) form.append('css', file('index.css', 'text/css'), 'index.css');
form.append('version', version);
if (message) form.append('message', message);
const revision = await ok(
  await fetch(`${url}/api/custom-component-libraries/${correlationId}/revisions`, { method: 'POST', headers: auth, body: form }),
  'publish revision'
);
console.log(`${libraryName}: published ${revision.version ?? version} (library ${library.id ?? library.libraryId ?? correlationId})`);
