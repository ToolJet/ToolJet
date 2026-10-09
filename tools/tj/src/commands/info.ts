import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../args.ts';
import { readEnv } from '../env.ts';
import { reachable } from '../net.ts';
import { defaultBase, nvmrc, repoAt, SUBMODULES } from '../repo.ts';
import { ports } from '../services.ts';
import { capture } from '../sh.ts';
import { loadState } from '../state.ts';
import { emit, EXIT, kv, ui } from '../ui.ts';

async function submoduleRef(root: string, sm: string) {
  const dir = join(root, sm);
  const branch = await capture('git', ['branch', '--show-current'], { cwd: dir });
  if (branch.code !== 0) return 'not initialized';
  if (branch.out) return branch.out;
  return `detached ${(await capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: dir })).out}`;
}

export const info: Command = {
  name: 'info',
  summary: 'Show branch, submodules, edition, DBs and ports for this checkout',
  usage: 'tj info [--json]',
  async run({ cwd }) {
    const repo = await repoAt(cwd);
    const env = readEnv(join(repo.root, '.env'));
    const envTest = readEnv(join(repo.root, '.env.test'));
    const p = ports(repo.root);
    const data = {
      root: repo.root,
      worktree: repo.isWorktree,
      branch: repo.branch || '(detached)',
      ...Object.fromEntries(await Promise.all(SUBMODULES.map(async (sm) => [sm, await submoduleRef(repo.root, sm)]))),
      edition: env.TOOLJET_EDITION || envTest.TOOLJET_EDITION || 'ce',
      devDb: env.PG_DB,
      testDb: envTest.PG_DB,
      server: existsSync(join(repo.root, '.env')) ? `http://localhost:${p.server}` : undefined,
      frontend: existsSync(join(repo.root, '.env')) ? `http://localhost:${p.frontend}` : undefined,
      node: process.version,
    };
    emit(data, () => kv(data));
  },
};

type Check = { name: string; ok: boolean; level: 'fail' | 'warn'; detail: string; hint?: string };

export const doctor: Command = {
  name: 'doctor',
  summary: 'Check prerequisites (node, submodules, env, Postgres, Redis, gh) with fix hints',
  usage: 'tj doctor [--json]',
  async run({ cwd }) {
    const repo = await repoAt(cwd);
    const env = { ...readEnv(join(repo.main, '.env')), ...readEnv(join(repo.root, '.env.test')), ...readEnv(join(repo.root, '.env')) };
    const checks: Check[] = [];
    const add = (c: Check) => checks.push(c);

    const want = nvmrc(repo.root);
    add({ name: 'node', ok: process.version === want, level: 'fail', detail: process.version, hint: `nvm install ${want} && nvm use` });
    for (const sm of SUBMODULES) {
      const ref = await submoduleRef(repo.root, sm);
      add({ name: sm, ok: ref !== 'not initialized', level: 'warn', detail: ref, hint: 'tj setup (needs EE access)' });
    }
    const envFile = ['.env', '.env.test'].find((f) => existsSync(join(repo.main, f)));
    add({ name: 'env file', ok: Boolean(envFile), level: 'fail', detail: envFile ? join(repo.main, envFile) : 'none', hint: 'cp .env.example .env in the main checkout' });
    const pg = `${env.PG_HOST || 'localhost'}:${env.PG_PORT || 5432}`;
    add({ name: 'postgres', ok: await reachable(env.PG_HOST || 'localhost', Number(env.PG_PORT || 5432)), level: 'fail', detail: pg, hint: 'start Postgres' });
    const createdb = await capture('createdb', ['--version'], { cwd: repo.root });
    add({ name: 'createdb', ok: createdb.code === 0, level: 'fail', detail: createdb.out || 'missing', hint: 'install Postgres client tools' });
    const redis = `${env.REDIS_HOST || 'localhost'}:${env.REDIS_PORT || 6379}`;
    add({ name: 'redis', ok: await reachable(env.REDIS_HOST || 'localhost', Number(env.REDIS_PORT || 6379)), level: 'warn', detail: redis, hint: 'docker compose up -d redis (needed by tj start)' });
    const gh = await capture('gh', ['auth', 'status'], { cwd: repo.root });
    add({ name: 'gh auth', ok: gh.code === 0, level: 'warn', detail: gh.code === 0 ? 'logged in' : 'not logged in', hint: 'gh auth login' });
    const stack = await capture('gh', ['stack', '--help'], { cwd: repo.root });
    add({ name: 'gh stack', ok: stack.code === 0, level: 'warn', detail: stack.code === 0 ? 'installed' : 'missing', hint: 'gh extension install github/gh-stack' });
    const localHead = (await capture('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], { cwd: repo.root })).out;
    const remoteHead = await defaultBase(repo.root);
    add({
      name: 'origin/HEAD',
      ok: !localHead || !remoteHead || localHead === remoteHead,
      level: 'warn',
      detail: localHead ? `${localHead} (remote default: ${remoteHead ?? 'unknown, remote unreachable'})` : 'unset',
      hint: 'git remote set-head origin --auto  (a stale value makes gh stack retarget PRs)',
    });
    const state = loadState(repo.root);
    if (state.ports) add({ name: 'ports', ok: true, level: 'warn', detail: `server :${state.ports.server}, frontend :${state.ports.frontend}` });

    const failed = checks.filter((c) => !c.ok && c.level === 'fail');
    emit({ ok: failed.length === 0, checks }, () => {
      for (const c of checks) {
        if (c.ok) ui.ok(`${c.name}  ${c.detail}`);
        else (c.level === 'fail' ? ui.fail : ui.warn)(`${c.name}  ${c.detail}`);
        if (!c.ok && c.hint) ui.hint(c.hint);
      }
    });
    if (failed.length) {
      ui.fail(`${failed.length} check(s) failed`);
      process.exitCode = EXIT.fail;
    }
  },
};
