import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../args.ts';
import { processEnv, readEnv, withoutDotEnv, writeEnv } from '../env.ts';
import { freePort } from '../net.ts';
import { dbNames, localModule, nvmrc, type Repo, repoAt, SUBMODULES, worktrees } from '../repo.ts';
import { capture, git, run } from '../sh.ts';
import { loadState, logFile, saveState, type State } from '../state.ts';
import { emit, kv, since, TjError, ui } from '../ui.ts';

export type SetupOpts = { frontend: boolean; app: boolean; force: boolean };

export function checkNode(root: string) {
  const want = nvmrc(root);
  if (process.version !== want)
    throw new TjError(`node ${process.version}, but .nvmrc wants ${want}`, { hint: `nvm install ${want} && nvm use` });
}

async function syncSubmodules(repo: Repo) {
  for (const sm of SUBMODULES) {
    const local = localModule(repo.main, sm);
    if (!local) {
      ui.warn(`${sm}: not available (no EE access?) — skipping`);
      continue;
    }
    // Worktrees clone from the main checkout's module repo so unpushed EE branches are visible.
    const url = repo.isWorktree ? ['-c', 'protocol.file.allow=always', '-c', `submodule.${sm}.url=${local}`] : [];
    await git(repo.root, ...url, 'submodule', 'update', '--init', sm);
    const same = await capture('git', ['rev-parse', '-q', '--verify', `origin/${repo.branch}`], { cwd: join(repo.root, sm) });
    if (repo.isWorktree && repo.branch && same.code === 0) {
      const has = await capture('git', ['rev-parse', '-q', '--verify', `refs/heads/${repo.branch}`], { cwd: join(repo.root, sm) });
      await git(join(repo.root, sm), 'checkout', '-q', ...(has.code === 0 ? [repo.branch] : ['-b', repo.branch, `origin/${repo.branch}`]));
      ui.ok(`${sm} on ${repo.branch}`);
    } else ui.ok(`${sm} at pinned commit`);
  }
}

const lockHash = (dir: string) => createHash('sha1').update(readFileSync(join(dir, 'package-lock.json'))).digest('hex');

async function installDeps(repo: Repo, state: State, dirs: string[], force: boolean) {
  state.deps ??= {};
  const deps = state.deps;
  await Promise.all(
    dirs.map(async (d) => {
      const dir = d === 'root' ? repo.root : join(repo.root, d);
      const hash = lockHash(dir);
      if (!force && deps[d] === hash && existsSync(join(dir, 'node_modules'))) return ui.info(`${d}: deps up to date`);
      const t = Date.now();
      ui.step(`${d}: npm ci`);
      await run(`${d} npm ci`, 'npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], { cwd: dir, log: logFile(repo.root, `npm-${d}`) });
      deps[d] = hash;
      ui.ok(`${d}: deps installed ${since(t)}`);
    }),
  );
  const pluginsHash = (await capture('git', ['rev-parse', 'HEAD:plugins'], { cwd: repo.root })).out || deps.plugins;
  if (force || deps['plugins:build'] !== pluginsHash || !existsSync(join(repo.root, 'plugins', 'dist'))) {
    const t = Date.now();
    ui.step('plugins: build');
    await run('plugins build', 'npm', ['run', 'build'], { cwd: join(repo.root, 'plugins'), log: logFile(repo.root, 'plugins-build') });
    deps['plugins:build'] = pluginsHash;
    ui.ok(`plugins: built ${since(t)}`);
  } else ui.info('plugins: build up to date');
}

function envSource(repo: Repo, prefer: '.env.test' | '.env') {
  const files = prefer === '.env.test' ? ['.env.test', '.env'] : ['.env'];
  const src = files.map((f) => join(repo.main, f)).find(existsSync);
  if (!src) throw new TjError(`no ${files.join(' or ')} in ${repo.main}`, { hint: 'copy .env.example to .env in the main checkout and fill in Postgres/Redis' });
  return readFileSync(src, 'utf8');
}

async function dbSetup(repo: Repo, which: 'test' | 'dev') {
  const t = Date.now();
  ui.step(`${which} DB: create + migrate`);
  const server = join(repo.root, 'server');
  const log = logFile(repo.root, `db-${which}`);
  if (which === 'test')
    await withoutDotEnv(repo.root, () =>
      run('test DB setup', 'npm', ['run', 'db:setup'], { cwd: server, env: processEnv(readEnv(join(repo.root, '.env.test')), { NODE_ENV: '' }), log }),
    );
  else await run('dev DB setup', 'npm', ['run', 'db:setup'], { cwd: server, env: processEnv({}, { NODE_ENV: '' }), log });
  ui.ok(`${which} DB ready ${since(t)}`);
}

async function takenPorts(main: string) {
  const taken = new Set([3000, 8082]);
  for (const w of await worktrees(main)) {
    const p = loadState(w.path).ports;
    if (p?.server) taken.add(p.server);
    if (p?.frontend) taken.add(p.frontend);
  }
  return taken;
}

export async function setup(repo: Repo, o: SetupOpts) {
  checkNode(repo.root);
  const state = loadState(repo.root);
  const names = dbNames(repo.branch || 'detached');

  ui.step('submodules');
  await syncSubmodules(repo);

  const envTest = join(repo.root, '.env.test');
  if (repo.isWorktree && !existsSync(envTest)) {
    writeEnv(envTest, envSource(repo, '.env.test'), { PG_DB: names.test, TOOLJET_DB: names.tjdbTest });
    state.dbs = { ...state.dbs, test: names.test, tjdbTest: names.tjdbTest };
    ui.ok(`.env.test → ${names.test}`);
  }

  // root: husky, lint-staged and typescript, so pre-commit hooks work in the worktree
  await installDeps(repo, state, ['root', 'server', 'plugins', ...(o.frontend || o.app ? ['frontend'] : [])], o.force);
  saveState(repo.root, { ...state, branch: repo.branch });
  if (existsSync(envTest)) await dbSetup(repo, 'test');
  else ui.warn('no .env.test — skipping test DB');

  if (o.app) {
    if (repo.isWorktree) {
      const taken = await takenPorts(repo.main);
      const server = state.ports?.server ?? (await freePort(3010, taken));
      taken.add(server);
      const frontend = state.ports?.frontend ?? (await freePort(8092, taken));
      state.ports = { server, frontend };
      state.dbs = { ...state.dbs, dev: names.dev, tjdbDev: names.tjdbDev };
      const envFile = join(repo.root, '.env');
      const base = existsSync(envFile) ? readFileSync(envFile, 'utf8') : envSource(repo, '.env');
      writeEnv(envFile, base, {
        PG_DB: names.dev,
        TOOLJET_DB: names.tjdbDev,
        PORT: String(server),
        TOOLJET_SERVER_PORT: String(server),
        TOOLJET_HOST: `http://localhost:${frontend}`,
      });
      ui.ok(`.env → ${names.dev}, server :${server}, frontend :${frontend}`);
    } else if (!existsSync(join(repo.root, '.env'))) throw new TjError('no .env in the main checkout', { hint: 'cp .env.example .env' });
    await dbSetup(repo, 'dev');
  }

  saveState(repo.root, { ...state, branch: repo.branch });
  const env = readEnv(join(repo.root, '.env'));
  return {
    root: repo.root,
    branch: repo.branch,
    testDb: readEnv(envTest).PG_DB,
    devDb: o.app ? env.PG_DB : undefined,
    serverPort: o.app ? Number(env.PORT || 3000) : undefined,
    frontendPort: o.app ? state.ports?.frontend ?? 8082 : undefined,
  };
}

export const setupOptions = {
  frontend: { type: 'boolean', desc: 'Also install frontend deps' },
  app: { type: 'boolean', desc: 'Make it runnable: dev DB, free ports, .env (implies --frontend)' },
  force: { type: 'boolean', desc: 'Reinstall deps and rebuild plugins even if up to date' },
} as const;

export const setupCmd: Command = {
  name: 'setup',
  summary: 'Bootstrap this checkout: submodules, deps, plugins, test DBs (idempotent)',
  usage: 'tj setup [--frontend] [--app] [--force]',
  options: setupOptions,
  async run({ values, cwd }) {
    const t = Date.now();
    const result = await setup(await repoAt(cwd), { frontend: !!values.frontend, app: !!values.app, force: !!values.force });
    ui.ok(`setup done ${since(t)}`);
    emit(result, () => kv(result));
  },
};
