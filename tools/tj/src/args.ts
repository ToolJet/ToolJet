import { parseArgs } from 'node:util';
import { EXIT, TjError } from './ui.ts';

export type Opt = { type: 'string' | 'boolean'; short?: string; desc: string; default?: string | boolean };
export type Values = Record<string, string | boolean | undefined>;
export type Ctx = { values: Values; args: string[]; cwd: string };

export type Command = {
  name: string; // "start", "wt add"
  summary: string;
  usage: string;
  options?: Record<string, Opt>;
  run: (ctx: Ctx) => Promise<void>;
};

export const globalOptions: Record<string, Opt> = {
  json: { type: 'boolean', desc: 'Machine-readable result on stdout' },
  yes: { type: 'boolean', short: 'y', desc: 'Assume yes; never prompt' },
  quiet: { type: 'boolean', short: 'q', desc: 'Only warnings and errors on stderr' },
  verbose: { type: 'boolean', short: 'v', desc: 'Stream subprocess output to stderr' },
  help: { type: 'boolean', short: 'h', desc: 'Show help' },
};

export function resolve(commands: Command[], argv: string[]) {
  const words = argv.filter((a) => !a.startsWith('-'));
  for (const n of [2, 1]) {
    const name = words.slice(0, n).join(' ');
    const cmd = commands.find((c) => c.name === name);
    if (cmd) {
      const rest = [...argv];
      for (const w of name.split(' ')) rest.splice(rest.indexOf(w), 1);
      return { cmd, rest };
    }
  }
  return { cmd: undefined, rest: argv };
}

export function parse(cmd: Command | undefined, rest: string[]) {
  const options = { ...globalOptions, ...(cmd?.options ?? {}) };
  try {
    const { values, positionals } = parseArgs({ args: rest, options, allowPositionals: true, strict: true });
    return { values: values as Values, positionals };
  } catch (e) {
    throw new TjError((e as Error).message, { code: EXIT.usage, hint: `tj ${cmd?.name ?? ''} --help`.replace('  ', ' ') });
  }
}

export function requireArg(ctx: Ctx, i: number, name: string, usage: string): string {
  const v = ctx.args[i];
  if (!v) throw new TjError(`missing <${name}>`, { code: EXIT.usage, hint: `usage: ${usage}` });
  return v;
}
