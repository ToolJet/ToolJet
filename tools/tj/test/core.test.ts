import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { test } from 'node:test';
import { type Command, parse, resolve } from '../src/args.ts';
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
