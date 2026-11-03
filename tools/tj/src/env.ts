import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

export type Env = Record<string, string>;

export function readEnv(file: string): Env {
  return existsSync(file) ? (parseEnv(readFileSync(file, 'utf8')) as Env) : {};
}

export function setKeys(content: string, updates: Env): string {
  const lines = content.split('\n');
  const pending = new Map(Object.entries(updates));
  const out = lines.map((l) => {
    const key = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(l)?.[1];
    if (key && pending.has(key)) {
      const v = pending.get(key);
      pending.delete(key);
      return `${key}=${v}`;
    }
    return l;
  });
  while (out.length && out[out.length - 1] === '') out.pop();
  for (const [k, v] of pending) out.push(`${k}=${v}`);
  return `${out.join('\n')}\n`;
}

export function writeEnv(file: string, base: string, updates: Env) {
  writeFileSync(file, setKeys(base, updates));
}

// server/scripts/database-config-utils.ts merges ../.env over process.env (and NODE_ENV=test
// makes db:migrate a no-op), so test-DB commands run with .env moved aside.
export async function withoutDotEnv<T>(root: string, fn: () => Promise<T>): Promise<T> {
  const env = join(root, '.env');
  const hidden = join(root, '.env.tj-hidden');
  if (existsSync(hidden) && !existsSync(env)) renameSync(hidden, env); // recover from a crashed run
  const moved = existsSync(env);
  if (moved) renameSync(env, hidden);
  // SIGINT exits via process.exit, which skips finally
  const restore = () => moved && existsSync(hidden) && renameSync(hidden, env);
  process.once('exit', restore);
  try {
    return await fn();
  } finally {
    process.off('exit', restore);
    restore();
  }
}

export function processEnv(vars: Env, extra: Env = {}): NodeJS.ProcessEnv {
  return { ...process.env, ...vars, ...extra };
}
