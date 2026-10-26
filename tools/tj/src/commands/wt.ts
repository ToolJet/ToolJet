import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { type Command, requireArg } from '../args.ts';
import { readEnv } from '../env.ts';
import { dbNames, defaultBase, findWorktree, repoAt, SUBMODULES, worktreeDir, worktrees } from '../repo.ts';
import { status, SERVICES } from '../services.ts';
import { capture, git, killGroup, owned } from '../sh.ts';
import { clearRun, loadRun, loadState } from '../state.ts';
import { emit, EXIT, interactive, since, TjError, ui } from '../ui.ts';
import { setup, setupOptions } from './setup.ts';

async function branchExists(root: string, ref: string) {
  return (await capture('git', ['rev-parse', '-q', '--verify', ref], { cwd: root })).code === 0;
}

export const wtAdd: Command = {
  name: 'wt add',
  summary: 'Create a worktree for <branch> (existing, remote, or new from --base) and set it up',
  usage: 'tj wt add <branch> [--base <ref>] [--path <dir>] [--frontend] [--app] [--force]',
  options: { base: { type: 'string', desc: 'Base for a new branch (default: origin HEAD)' }, path: { type: 'string', desc: 'Worktree dir (default: .worktrees/<slug>)' }, ...setupOptions },
  async run(ctx) {
    const t = Date.now();
    const branch = requireArg(ctx, 0, 'branch', this.usage);
    const main = (await repoAt(ctx.cwd)).main;
    const existing = await findWorktree(main, branch);
    if (!existing) await capture('git', ['fetch', '-q', 'origin', branch], { cwd: main }); // may not exist remotely
    const path = existing?.path ?? (ctx.values.path as string | undefined) ?? worktreeDir(main, branch);
    if (existing) ui.info(`worktree exists: ${path}`);
    else if (await branchExists(main, `refs/heads/${branch}`)) await git(main, 'worktree', 'add', path, branch);
    else if (await branchExists(main, `refs/remotes/origin/${branch}`)) await git(main, 'worktree', 'add', '--track', '-b', branch, path, `origin/${branch}`);
    else {
      const base = (ctx.values.base as string | undefined) ?? (await defaultBase(main));
      if (!base) throw new TjError('could not read the remote default branch', { hint: 'pass --base <ref>' });
      if (base.startsWith('origin/')) await git(main, 'fetch', '-q', 'origin', base.slice('origin/'.length));
      await git(main, 'worktree', 'add', '-b', branch, path, base);
      ui.ok(`new branch ${branch} from ${base}`);
    }
    if (!existing) ui.ok(`worktree ${path}`);
    const v = ctx.values;
    const result = await setup(await repoAt(path), { frontend: !!v.frontend, app: !!v.app, force: !!v.force });
    ui.ok(`ready ${since(t)}`);
    emit({ path, ...result }, () => process.stdout.write(`${path}\n`));
  },
};

async function confirm(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// Root commits survive `worktree remove` (shared repo); submodule git dirs live in the
// worktree's admin dir and are deleted with it, so their unpushed commits count too.
export async function unsavedWork(path: string) {
  const found: string[] = [];
  const repos = [{ dir: path, label: 'worktree', pin: '' }, ...SUBMODULES.map((sm) => ({ dir: join(path, sm), label: sm, pin: sm }))];
  for (const { dir, label, pin } of repos) {
    if (!existsSync(join(dir, '.git'))) continue;
    if ((await capture('git', ['status', '--porcelain', '--ignore-submodules=all'], { cwd: dir })).out) found.push(`${label}: uncommitted changes`);
    if (!pin) continue;
    const pinned = await capture('git', ['rev-parse', '-q', '--verify', `HEAD:${pin}`], { cwd: path });
    const ahead = (await capture('git', ['log', '--oneline', 'HEAD', '--branches', '--not', '--remotes', ...(pinned.code === 0 ? [pinned.out] : [])], { cwd: dir })).out;
    if (ahead) found.push(`${label}: ${ahead.split('\n').length} unpushed commit(s)`);
  }
  return found;
}

async function dropDb(name: string, env: Record<string, string>, prefix: 'PG' | 'TOOLJET_DB') {
  const get = (k: string) => env[`${prefix}_${k}`] || env[`PG_${k}`] || undefined;
  const args = ['--if-exists', '-h', get('HOST') ?? 'localhost', '-p', get('PORT') ?? '5432', '-U', get('USER') ?? 'postgres', name];
  const r = await capture('dropdb', args, { cwd: process.cwd(), env: { ...process.env, PGPASSWORD: get('PASS') ?? '' } });
  if (r.code !== 0) throw new TjError(`dropdb ${name} failed: ${r.err}`);
}

export const wtRm: Command = {
  name: 'wt rm',
  summary: 'Stop services, drop the worktree DBs and remove the worktree',
  usage: 'tj wt rm <branch|path> [--yes] [--discard-changes] [--delete-branch] [--dry-run]',
  options: {
    'discard-changes': { type: 'boolean', desc: 'Remove even with uncommitted changes or unpushed commits' },
    'delete-branch': { type: 'boolean', desc: 'Also delete the local branch (git branch -d)' },
    'dry-run': { type: 'boolean', desc: 'Show what would be removed' },
  },
  async run(ctx) {
    const ref = requireArg(ctx, 0, 'branch|path', this.usage);
    const main = (await repoAt(ctx.cwd)).main;
    const wt = await findWorktree(main, ref);
    if (!wt) throw new TjError(`no worktree for ${ref}`, { hint: 'tj wt ls' });
    if (wt.main) throw new TjError('refusing to remove the main checkout');
    const names = dbNames(wt.branch || 'detached');
    const state = loadState(wt.path);
    const dbs = { ...names, ...state.dbs };
    const env = { ...readEnv(join(wt.path, '.env.test')), ...readEnv(join(wt.path, '.env')) };
    const unsaved = await unsavedWork(wt.path);
    const plan = { path: wt.path, branch: wt.branch, dropDbs: Object.values(dbs), deleteBranch: !!ctx.values['delete-branch'], unsaved };
    if (ctx.values['dry-run']) return emit({ dryRun: true, ...plan }, () => Object.entries(plan).forEach(([k, v]) => ui.info(`${k}: ${v}`)));
    if (unsaved.length && !ctx.values['discard-changes'])
      throw new TjError(`unsaved work would be lost: ${unsaved.join('; ')}`, { code: EXIT.usage, hint: 'commit and push it, or re-run with --discard-changes' });
    if (!ctx.values.yes) {
      if (!interactive) throw new TjError(`would remove ${wt.path} and drop ${plan.dropDbs.length} DBs`, { code: EXIT.usage, hint: 're-run with --yes' });
      if (!(await confirm(`Remove ${wt.path} and drop its DBs?`))) throw new TjError('aborted');
    }
    const t = Date.now();
    for (const svc of SERVICES) {
      const run = loadRun(wt.path, svc);
      if (run && (await owned(run))) {
        await killGroup(run.pid);
        ui.ok(`${svc} stopped`);
      }
      clearRun(wt.path, svc);
    }
    if (existsSync(join(wt.path, '.env.test')) || existsSync(join(wt.path, '.env'))) {
      for (const db of [dbs.test, dbs.dev]) if (db) await dropDb(db, env, 'PG');
      for (const db of [dbs.tjdbTest, dbs.tjdbDev]) if (db) await dropDb(db, env, 'TOOLJET_DB');
      ui.ok(`dropped ${plan.dropDbs.join(', ')}`);
    }
    await git(main, 'worktree', 'remove', '--force', wt.path);
    ui.ok(`removed ${wt.path}`);
    if (plan.deleteBranch && wt.branch) {
      const r = await capture('git', ['branch', '-d', wt.branch], { cwd: main });
      r.code === 0 ? ui.ok(`deleted branch ${wt.branch}`) : ui.warn(`kept branch ${wt.branch}: ${r.err}`);
    }
    ui.ok(`done ${since(t)}`);
    emit(plan);
  },
};

export const wtLs: Command = {
  name: 'wt ls',
  summary: 'List worktrees with ports and running services',
  usage: 'tj wt ls [--json]',
  async run({ cwd }) {
    const main = (await repoAt(cwd)).main;
    const list = await Promise.all(
      (await worktrees(main)).map(async (w) => ({
        ...w,
        ports: loadState(w.path).ports,
        running: (await Promise.all(SERVICES.map((s) => status(w.path, s)))).filter((s) => s.running).map((s) => s.service),
      })),
    );
    emit({ worktrees: list }, () => {
      for (const w of list) {
        const ports = w.ports ? ` :${w.ports.server}/:${w.ports.frontend}` : '';
        const up = w.running.length ? ` [${w.running.join(',')}]` : '';
        process.stdout.write(`${w.branch || w.head}\t${w.path}${ports}${up}${w.main ? ' (main)' : ''}\n`);
      }
    });
  },
};

export const wtPath: Command = {
  name: 'wt path',
  summary: 'Print the worktree path for <branch> (cd "$(tj wt path x)")',
  usage: 'tj wt path <branch>',
  async run(ctx) {
    const ref = requireArg(ctx, 0, 'branch', this.usage);
    const wt = await findWorktree((await repoAt(ctx.cwd)).main, ref);
    if (!wt) throw new TjError(`no worktree for ${ref}`, { hint: `tj wt add ${ref}` });
    emit({ path: wt.path, branch: wt.branch }, () => process.stdout.write(`${wt.path}\n`));
  },
};
