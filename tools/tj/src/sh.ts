// Subprocesses. Child output never reaches stdout: it goes to a log file (default) or stderr (--verbose).
import { spawn } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { flags, TjError, ui } from './ui.ts';

type RunOpts = { cwd: string; env?: NodeJS.ProcessEnv };

// Capture output; for queries (git, gh). Never throws on exit code.
export function capture(cmd: string, args: string[], opts: RunOpts): Promise<{ code: number; out: string; err: string }> {
  return new Promise((done) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => done({ code: 127, out, err: e.message }));
    p.on('close', (code) => done({ code: code ?? 1, out: out.trim(), err: err.trim() }));
  });
}

export async function git(cwd: string, ...args: string[]) {
  const r = await capture('git', args, { cwd });
  if (r.code !== 0) throw new TjError(`git ${args.join(' ')} failed: ${r.err || r.out}`);
  return r.out;
}

export function tail(file: string, n = 30): string {
  if (!existsSync(file)) return '';
  return readFileSync(file, 'utf8').trimEnd().split('\n').slice(-n).join('\n');
}

export function run(label: string, cmd: string, args: string[], opts: RunOpts & { log: string }): Promise<void> {
  mkdirSync(dirname(opts.log), { recursive: true });
  appendFileSync(opts.log, `\n$ ${cmd} ${args.join(' ')}  (cwd ${opts.cwd})\n`);
  const fd = flags.verbose ? 2 : openSync(opts.log, 'a');
  return new Promise((done, fail) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ['ignore', fd, fd] });
    const finish = (code: number | null, why?: string) => {
      if (fd !== 2) closeSync(fd);
      if (code === 0) return done();
      if (!flags.verbose) process.stderr.write(`${tail(opts.log)}\n`);
      fail(new TjError(`${label} failed${why ? `: ${why}` : ` (exit ${code})`}`, { hint: `full log: ${opts.log}` }));
    };
    p.on('error', (e) => finish(1, e.message));
    p.on('close', (code) => finish(code));
  });
}

// Long-running service: own process group, output to its log, survives this CLI exiting.
export function startDetached(cmd: string, args: string[], opts: RunOpts & { log: string }): number {
  mkdirSync(dirname(opts.log), { recursive: true });
  const fd = openSync(opts.log, 'a');
  const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ['ignore', fd, fd], detached: true });
  closeSync(fd);
  p.unref();
  if (!p.pid) throw new TjError(`could not start ${cmd}`);
  return p.pid;
}

export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function procStart(pid: number) {
  return (await capture('ps', ['-o', 'lstart=', '-p', String(pid)], { cwd: process.cwd() })).out;
}

// pid alone can be reused after a reboot
export async function owned(run: { pid: number; procStart?: string } | undefined) {
  return !!run && alive(run.pid) && (!run.procStart || (await procStart(run.pid)) === run.procStart);
}

export async function killGroup(pid: number, graceMs = 10_000) {
  const signal = (s: NodeJS.Signals) => {
    try {
      process.kill(-pid, s);
    } catch {
      /* already gone */
    }
  };
  signal('SIGTERM');
  const deadline = Date.now() + graceMs;
  while (alive(pid) && Date.now() < deadline) await sleep(250);
  if (alive(pid)) {
    ui.debug(`pid ${pid} ignored SIGTERM; sending SIGKILL`);
    signal('SIGKILL');
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
