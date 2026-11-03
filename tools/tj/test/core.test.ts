import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { type Command, parse, resolve } from '../src/args.ts';
import { installedFrom, nestedModules } from '../src/commands/setup.ts';
import { unsavedWork } from '../src/commands/wt.ts';
import { setKeys } from '../src/env.ts';
import { freePort } from '../src/net.ts';
import { dbNames, slugHash } from '../src/repo.ts';

test('slugHash matches git hash-object, so names match earlier tooling', () => {
  const branch = 'feat/18200-Data-Source.folder';
  const git = execFileSync('git', ['hash-object', '--stdin'], { input: branch }).toString().slice(0, 6);
  assert.equal(slugHash(branch), `feat_18200_data_source_folder_${git}`);
});

test('similar branches get different DB names, all under 63 chars with shard suffix', () => {
  const a = dbNames('feat/a-very-long-branch-name-that-goes-on-and-on-1');
  const b = dbNames('feat/a-very-long-branch-name-that-goes-on-and-on-2');
  assert.notEqual(a.test, b.test);
  assert.ok(`${a.tjdbTest}_shard_9`.length <= 63);
});

test('setKeys replaces in place, keeps other lines, appends missing keys after a newline', () => {
  const out = setKeys('A=1\n# keep\nexport PORT=3000\nB=2', { PORT: '3010', NEW: 'x' });
  assert.equal(out, 'A=1\n# keep\nPORT=3010\nB=2\nNEW=x\n');
});

const cmd = (name: string, options = {}): Command => ({ name, summary: '', usage: '', options, run: async () => {} });

test('resolve picks the longest command name and leaves flags/positionals', () => {
  const cmds = [cmd('wt add'), cmd('wt'), cmd('start')];
  const { cmd: c, rest } = resolve(cmds, ['wt', 'add', 'feat/x', '--app']);
  assert.equal(c?.name, 'wt add');
  assert.deepEqual(rest, ['feat/x', '--app']);
});

test('unknown flags are usage errors (exit 2)', () => {
  assert.throws(() => parse(cmd('start'), ['--nope']), (e: { code: number }) => e.code === 2);
});

test('freePort skips a port that is in use', async () => {
  const busy = createServer().listen(0, '0.0.0.0');
  await new Promise((r) => busy.once('listening', r));
  const port = (busy.address() as { port: number }).port;
  assert.notEqual(await freePort(port), port);
  busy.close();
});

test('freePort skips ports already handed out', async () => {
  const from = await freePort(20000);
  assert.notEqual(await freePort(from, new Set([from])), from);
});

// git hooks export GIT_DIR/GIT_INDEX_FILE; they would point the temp repos below at the real one
for (const k of Object.keys(process.env)) if (k.startsWith('GIT_')) delete process.env[k];

const sh = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, stdio: 'pipe' });

test('unsavedWork flags uncommitted files and submodule commits that exist nowhere else', async () => {
  const root = mkdtempSync(join(tmpdir(), 'tj-wt-'));
  const origin = join(root, 'origin');
  const wt = join(root, 'wt');
  mkdirSync(origin);
  sh(origin, 'init', '-q');
  sh(origin, 'commit', '-q', '--allow-empty', '-m', 'base');
  mkdirSync(join(wt, 'server'), { recursive: true });
  sh(wt, 'init', '-q');
  sh(wt, 'commit', '-q', '--allow-empty', '-m', 'root');
  sh(join(wt, 'server'), 'clone', '-q', origin, 'ee');
  writeFileSync(join(wt, '.git/info/exclude'), 'server/\n'); // stands in for the gitlink
  assert.deepEqual(await unsavedWork(wt), []);

  sh(join(wt, 'server/ee'), 'commit', '-q', '--allow-empty', '-m', 'local only');
  writeFileSync(join(wt, 'notes.txt'), 'x');
  assert.deepEqual(await unsavedWork(wt), ['worktree: uncommitted changes', 'server/ee: 1 unpushed commit(s)']);
});

test('installedFrom accepts node_modules built from the same lock, skipping uninstalled optional deps', () => {
  const lock = {
    packages: {
      '': {},
      'packages/a': { version: '1.0.0' },
      'node_modules/x': { version: '1.0.0' },
      'node_modules/fsevents': { version: '2.3.3', optional: true },
      'packages/a/node_modules/y': { version: '2.0.0' },
    },
  };
  const hidden = { packages: { 'node_modules/x': { version: '1.0.0' }, 'packages/a/node_modules/y': { version: '2.0.0' } } };
  assert.equal(installedFrom(lock, hidden), true);
  assert.equal(installedFrom(lock, { packages: { 'node_modules/x': { version: '1.0.1' } } }), false);
  assert.equal(installedFrom(lock, { packages: { 'node_modules/x': { version: '1.0.0' } } }), false);
  assert.deepEqual(nestedModules(hidden), ['packages/a/node_modules']);
});
