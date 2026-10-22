import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { capture, git } from './sh.ts';
import { TjError } from './ui.ts';

export const SUBMODULES = ['server/ee', 'frontend/ee'] as const;

export type Repo = {
  root: string; // this checkout (main or worktree)
  main: string; // main checkout
  isWorktree: boolean;
  branch: string; // '' when detached
};

export async function repoAt(cwd: string): Promise<Repo> {
  const top = await capture('git', ['rev-parse', '--show-superproject-working-tree', '--show-toplevel'], { cwd });
  if (top.code !== 0) throw new TjError('not inside a git checkout', { hint: 'cd into your ToolJet checkout' });
  const lines = top.out.split('\n').filter(Boolean);
  const root = lines[0]; // superproject comes first when inside a submodule
  if (!existsSync(join(root, 'server')) || !existsSync(join(root, 'frontend')))
    throw new TjError(`${root} is not a ToolJet checkout`, { hint: 'cd into your ToolJet checkout' });
  const main = dirname(await git(root, 'rev-parse', '--path-format=absolute', '--git-common-dir'));
  const branch = (await capture('git', ['branch', '--show-current'], { cwd: root })).out;
  return { root, main, isWorktree: root !== main, branch };
}

// git blob sha1, same as `git hash-object --stdin`, so names match earlier tooling.
export function slugHash(branch: string) {
  const hash = createHash('sha1').update(`blob ${Buffer.byteLength(branch)}\0${branch}`).digest('hex').slice(0, 6);
  const slug = branch.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  return `${slug}_${hash}`;
}

// Test DBs stay ≤ 63 chars even with run-e2e.sh's `_shard_N` suffix.
export function dbNames(branch: string) {
  const id = slugHash(branch);
  return { dev: `tooljet_${id}`, tjdbDev: `tooljet_db_${id}`, test: `tooljet_${id}_test`, tjdbTest: `tooljet_db_${id}_test` };
}

export function nvmrc(root: string) {
  return readFileSync(join(root, '.nvmrc'), 'utf8').replace(/[\s#].*$/s, '');
}

// Local module repo of a submodule in the main checkout (holds unpushed EE branches).
export function localModule(main: string, sm: string) {
  const dir = join(main, '.git', 'modules', sm);
  return existsSync(dir) ? dir : undefined;
}

export function worktreeDir(main: string, branch: string) {
  return join(main, '.worktrees', slugHash(branch));
}

export type Worktree = { path: string; branch: string; head: string; main: boolean };

export async function worktrees(main: string): Promise<Worktree[]> {
  const out = await git(main, 'worktree', 'list', '--porcelain');
  return out.split('\n\n').map((block) => {
    const get = (k: string) => block.split('\n').find((l) => l.startsWith(`${k} `))?.slice(k.length + 1) ?? '';
    const path = get('worktree');
    return { path, branch: get('branch').replace('refs/heads/', ''), head: get('HEAD').slice(0, 10), main: path === main };
  });
}

export async function findWorktree(main: string, ref: string) {
  const all = await worktrees(main);
  return all.find((w) => w.branch === ref || w.path === ref || basename(w.path) === ref);
}

// Ask the remote: a local refs/remotes/origin/HEAD is set once at clone time and goes stale.
export async function defaultBase(root: string) {
  const r = await capture('git', ['ls-remote', '--symref', 'origin', 'HEAD'], { cwd: root });
  const branch = /^ref: refs\/heads\/(\S+)\s+HEAD/m.exec(r.out)?.[1];
  return branch && `origin/${branch}`;
}
