// Per-checkout state under .tj/ (gitignored): state.json, run/<svc>.json, logs/<name>.log.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type State = {
  branch?: string;
  dbs?: { dev?: string; tjdbDev?: string; test?: string; tjdbTest?: string };
  ports?: { server?: number; frontend?: number };
  deps?: Record<string, string>; // dir → package-lock hash at last install; plugins:build → plugins tree hash
};

export type RunInfo = { pid: number; procStart?: string; port: number; startedAt: string; log: string };

const dir = (root: string) => join(root, '.tj');
export const logFile = (root: string, name: string) => join(dir(root), 'logs', `${name}.log`);

function readJson<T>(file: string, fallback: T): T {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;
}

function writeJson(file: string, data: unknown) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export const loadState = (root: string) => readJson<State>(join(dir(root), 'state.json'), {});
export const saveState = (root: string, s: State) => writeJson(join(dir(root), 'state.json'), s);

const runFile = (root: string, svc: string) => join(dir(root), 'run', `${svc}.json`);
export const loadRun = (root: string, svc: string) => readJson<RunInfo | undefined>(runFile(root, svc), undefined);
export const saveRun = (root: string, svc: string, info: RunInfo) => writeJson(runFile(root, svc), info);
export const clearRun = (root: string, svc: string) => rmSync(runFile(root, svc), { force: true });
