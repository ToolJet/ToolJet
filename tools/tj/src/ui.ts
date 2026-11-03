// Output contract. stdout = data (JSON with --json), stderr = progress and logs.
// Colour + symbols on an interactive terminal; plain `tag:` lines when piped, in CI or under an agent.
import { styleText } from 'node:util';

type Style = Parameters<typeof styleText>[0];

export const EXIT = { ok: 0, fail: 1, usage: 2, notReady: 3 } as const;
type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export class TjError extends Error {
  hint?: string;
  code: ExitCode;
  constructor(message: string, opts: { hint?: string; code?: ExitCode } = {}) {
    super(message);
    this.hint = opts.hint;
    this.code = opts.code ?? EXIT.fail;
  }
}

const env = process.env;
export const isAgent = Boolean(env.CLAUDECODE || env.AI_AGENT || env.CODEX_SANDBOX || env.CURSOR_AGENT);
export const interactive = Boolean(process.stdin.isTTY && process.stderr.isTTY && !env.CI && !isAgent);
const fancy = Boolean(process.stderr.isTTY && !env.CI && !isAgent);

export const flags = { json: false, quiet: false, verbose: false };

const paint = (style: Style, text: string) => (fancy ? styleText(style, text, { stream: process.stderr }) : text);

function line(symbol: string, tag: string, style: Style, msg: string) {
  process.stderr.write(`${fancy ? paint(style, symbol) : `${tag}:`} ${msg}\n`);
}

export const ui = {
  step: (msg: string) => !flags.quiet && line('›', 'step', 'cyan', msg),
  ok: (msg: string) => !flags.quiet && line('✔', 'ok', 'green', msg),
  info: (msg: string) => !flags.quiet && line('·', 'info', 'dim', paint('dim', msg)),
  warn: (msg: string) => line('⚠', 'warn', 'yellow', msg),
  fail: (msg: string) => line('✖', 'fail', 'red', msg),
  hint: (msg: string) => line('→', 'hint', 'dim', paint('dim', msg)),
  debug: (msg: string) => flags.verbose && line('·', 'debug', 'gray', paint('gray', msg)),
  bold: (text: string) => paint('bold', text),
};

export function kv(rows: Record<string, unknown>, stream: NodeJS.WriteStream = process.stdout) {
  const keys = Object.keys(rows).filter((k) => rows[k] !== undefined);
  const width = Math.max(0, ...keys.map((k) => k.length));
  const color = fancy && stream.isTTY;
  for (const k of keys) {
    const v = String(rows[k]);
    stream.write(color ? `  ${styleText('dim', k.padEnd(width))}  ${v}\n` : `${k}=${v}\n`);
  }
}

export function emit(data: Record<string, unknown>, render?: () => void) {
  if (flags.json) process.stdout.write(`${JSON.stringify({ schemaVersion: 1, ok: true, ...data }, null, 2)}\n`);
  else render?.();
}

export function emitError(err: TjError) {
  if (flags.json) {
    const error = { message: err.message, hint: err.hint, exitCode: err.code };
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, ok: false, error }, null, 2)}\n`);
  }
  ui.fail(err.message);
  if (err.hint) ui.hint(err.hint);
}

export function since(start: number) {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}
