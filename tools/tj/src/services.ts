import { join } from 'node:path';
import { readEnv } from './env.ts';
import { owned } from './sh.ts';
import { loadRun } from './state.ts';
import { isFree } from './net.ts';

export const SERVICES = ['server', 'frontend'] as const;
export type Svc = (typeof SERVICES)[number];

export function ports(root: string) {
  const env = readEnv(join(root, '.env'));
  const host = env.TOOLJET_HOST ? new URL(env.TOOLJET_HOST) : undefined;
  return { server: Number(env.PORT || 3000), frontend: Number(host?.port || 8082) };
}

export function spec(svc: Svc, root: string) {
  const p = ports(root);
  if (svc === 'server')
    return { cwd: join(root, 'server'), args: ['run', 'start:dev'], port: p.server, env: { PORT: String(p.server) }, health: `http://localhost:${p.server}/api/health` };
  return {
    cwd: join(root, 'frontend'),
    args: ['start', '--', '--port', String(p.frontend)],
    port: p.frontend,
    env: { TOOLJET_SERVER_PORT: String(p.server) },
    health: `http://localhost:${p.frontend}/`,
  };
}

export async function status(root: string, svc: Svc) {
  const run = loadRun(root, svc);
  const port = spec(svc, root).port;
  const running = await owned(run);
  const listening = !(await isFree(port));
  return { service: svc, running, pid: running ? run?.pid : undefined, port, listening, url: `http://localhost:${port}`, log: run?.log };
}

export function pickServices(args: string[]): Svc[] {
  const picked = args.filter((a): a is Svc => (SERVICES as readonly string[]).includes(a));
  return picked.length ? picked : [...SERVICES];
}
