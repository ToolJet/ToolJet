import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type Command, requireArg } from '../args.ts';
import { readEnv } from '../env.ts';
import { reachable, waitHttp } from '../net.ts';
import { repoAt } from '../repo.ts';
import { pickServices, SERVICES, spec, status, type Svc } from '../services.ts';
import { alive, killGroup, owned, procStart, startDetached, tail } from '../sh.ts';
import { clearRun, loadRun, logFile, saveRun } from '../state.ts';
import { emit, EXIT, flags, since, TjError, ui } from '../ui.ts';

async function preflight(root: string) {
  const env = readEnv(join(root, '.env'));
  if (!existsSync(join(root, '.env'))) throw new TjError('no .env in this checkout', { hint: 'tj setup --app' });
  const checks = [
    { name: 'Postgres', host: env.PG_HOST || 'localhost', port: Number(env.PG_PORT || 5432), hint: 'start Postgres' },
    { name: 'Redis', host: env.REDIS_HOST || 'localhost', port: Number(env.REDIS_PORT || 6379), hint: 'docker compose up -d redis' },
  ];
  for (const c of checks)
    if (!(await reachable(c.host, c.port))) throw new TjError(`${c.name} not reachable at ${c.host}:${c.port}`, { hint: c.hint });
}

function printStatus(rows: Awaited<ReturnType<typeof status>>[]) {
  for (const s of rows)
    process.stdout.write(`${s.service}\t${s.running ? 'running' : s.listening ? 'port-busy' : 'stopped'}\t${s.url}${s.pid ? `\tpid ${s.pid}` : ''}\n`);
}

export const start: Command = {
  name: 'start',
  summary: 'Start dev servers in the background and wait until healthy (idempotent)',
  usage: 'tj start [server] [frontend] [--no-wait] [--timeout <sec>]',
  options: {
    'no-wait': { type: 'boolean', desc: 'Return right after spawning' },
    timeout: { type: 'string', desc: 'Seconds to wait for health (default 300)' },
  },
  async run({ values, args, cwd }) {
    const { root } = await repoAt(cwd);
    await preflight(root);
    const svcs = pickServices(args);
    const started: { svc: Svc; pid: number; t: number }[] = [];
    for (const svc of svcs) {
      const s = await status(root, svc);
      if (s.running) {
        ui.ok(`${svc} already running :${s.port}`);
        continue;
      }
      if (s.listening) throw new TjError(`${svc} port ${s.port} is in use by another process`, { hint: `lsof -nP -iTCP:${s.port} -sTCP:LISTEN` });
      const sp = spec(svc, root);
      const log = logFile(root, svc);
      const pid = startDetached('npm', sp.args, { cwd: sp.cwd, env: { ...process.env, ...sp.env }, log });
      saveRun(root, svc, { pid, procStart: await procStart(pid), port: sp.port, startedAt: new Date().toISOString(), log });
      ui.step(`${svc} starting :${sp.port} (pid ${pid})`);
      started.push({ svc, pid, t: Date.now() });
    }
    if (!values['no-wait']) {
      const timeoutMs = Number(values.timeout ?? 300) * 1000;
      const results = await Promise.all(
        started.map(async ({ svc, pid, t }) => ({ svc, t, outcome: await waitHttp(spec(svc, root).health, timeoutMs, () => alive(pid)) })),
      );
      for (const r of results) {
        if (r.outcome === 'ready') ui.ok(`${r.svc} ready ${since(r.t)}`);
        else {
          if (r.outcome === 'died') clearRun(root, r.svc);
          process.stderr.write(`${tail(logFile(root, r.svc), 20)}\n`);
          throw new TjError(`${r.svc} ${r.outcome === 'died' ? 'exited during startup' : 'not healthy in time'}`, {
            code: r.outcome === 'died' ? EXIT.fail : EXIT.notReady,
            hint: `tj logs ${r.svc}`,
          });
        }
      }
    }
    const rows = await Promise.all(svcs.map((s) => status(root, s)));
    emit({ services: rows }, () => printStatus(rows));
  },
};

export const stop: Command = {
  name: 'stop',
  summary: 'Stop dev servers started by tj (idempotent)',
  usage: 'tj stop [server] [frontend]',
  async run({ args, cwd }) {
    const { root } = await repoAt(cwd);
    for (const svc of pickServices(args)) {
      const run = loadRun(root, svc);
      if (run && (await owned(run))) {
        await killGroup(run.pid);
        ui.ok(`${svc} stopped`);
      } else ui.info(`${svc} not running`);
      clearRun(root, svc);
      if ((await status(root, svc)).listening) ui.warn(`${svc} port still in use by a process tj didn't start`);
    }
    const rows = await Promise.all(SERVICES.map((s) => status(root, s)));
    emit({ services: rows });
  },
};

export const statusCmd: Command = {
  name: 'status',
  summary: 'Show dev server state, ports and URLs',
  usage: 'tj status [--json]',
  async run({ cwd }) {
    const { root } = await repoAt(cwd);
    const rows = await Promise.all(SERVICES.map((s) => status(root, s)));
    emit({ services: rows }, () => printStatus(rows));
  },
};

export const logs: Command = {
  name: 'logs',
  summary: 'Print (or follow) a log: server, frontend, npm-<dir>, plugins-build, db-test, db-dev',
  usage: 'tj logs <name> [-n <lines>] [-f]',
  options: {
    lines: { type: 'string', short: 'n', desc: 'Lines from the end (default 50)' },
    follow: { type: 'boolean', short: 'f', desc: 'Keep printing new lines' },
  },
  async run(ctx) {
    const name = requireArg(ctx, 0, 'name', this.usage);
    const { root } = await repoAt(ctx.cwd);
    const file = logFile(root, name);
    if (!existsSync(file)) throw new TjError(`no log ${file}`, { hint: 'tj status' });
    const n = String(ctx.values.lines ?? 50);
    if (!ctx.values.follow || flags.json) return emit({ file, lines: tail(file, Number(n)).split('\n') }, () => process.stdout.write(`${tail(file, Number(n))}\n`));
    await new Promise<void>((done) => spawn('tail', ['-n', n, '-f', file], { stdio: 'inherit' }).on('close', () => done()));
  },
};
