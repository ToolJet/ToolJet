import { type Command, globalOptions, type Opt, parse, resolve } from './args.ts';
import { dbMigrate } from './commands/db.ts';
import { doctor, info } from './commands/info.ts';
import { setupCmd } from './commands/setup.ts';
import { logs, start, statusCmd, stop } from './commands/svc.ts';
import { wtAdd, wtLs, wtPath, wtRm } from './commands/wt.ts';
import { emit, emitError, EXIT, flags, TjError, ui } from './ui.ts';

const help: Command = {
  name: 'help',
  summary: 'List commands (--json for the full command table)',
  usage: 'tj help [<command>] [--json]',
  async run({ args }) {
    const cmd = args.length ? commands.find((c) => c.name === args.join(' ')) : undefined;
    if (cmd) return emit(describe(cmd), () => printCommand(cmd));
    emit({ commands: commands.map(describe), globalOptions }, printIndex);
  },
};

const commands: Command[] = [doctor, info, setupCmd, wtAdd, wtRm, wtLs, wtPath, start, stop, statusCmd, logs, dbMigrate, help];

function describe(c: Command) {
  return { name: c.name, summary: c.summary, usage: c.usage, options: c.options ?? {} };
}

const flag = (name: string, o: Opt) => `${o.short ? `-${o.short}, ` : '    '}--${name}${o.type === 'string' ? ' <value>' : ''}`;

function printOptions(opts: Record<string, Opt>) {
  const rows = Object.entries(opts).map(([n, o]) => [flag(n, o), o.desc] as const);
  const w = Math.max(...rows.map(([f]) => f.length));
  for (const [f, d] of rows) process.stdout.write(`  ${f.padEnd(w)}  ${d}\n`);
}

function printIndex() {
  const w = Math.max(...commands.map((c) => c.name.length));
  process.stdout.write(`${ui.bold('tj')} — ToolJet dev toolkit\n\nUsage: tj <command> [options]\n\nCommands:\n`);
  for (const c of commands) process.stdout.write(`  ${c.name.padEnd(w)}  ${c.summary}\n`);
  process.stdout.write('\nGlobal options:\n');
  printOptions(globalOptions);
  process.stdout.write('\nExit codes: 0 ok, 1 failed, 2 usage, 3 not ready (timeout). `tj <command> --help` for details.\n');
}

function printCommand(c: Command) {
  process.stdout.write(`${c.summary}\n\nUsage: ${c.usage}\n`);
  if (c.options && Object.keys(c.options).length) {
    process.stdout.write('\nOptions:\n');
    printOptions(c.options);
  }
}

async function main(argv: string[]) {
  const { cmd, rest } = resolve(commands, argv);
  const { values, positionals } = parse(cmd, rest);
  flags.json = Boolean(values.json);
  flags.quiet = Boolean(values.quiet);
  flags.verbose = Boolean(values.verbose);
  if (!cmd) {
    if (positionals.length) throw new TjError(`unknown command: ${positionals.join(' ')}`, { code: EXIT.usage, hint: 'tj help' });
    return help.run({ values, args: [], cwd: process.cwd() });
  }
  if (values.help) return emit(describe(cmd), () => printCommand(cmd));
  await cmd.run({ values, args: positionals, cwd: process.cwd() });
}

process.on('SIGINT', () => process.exit(130));

main(process.argv.slice(2)).catch((e: unknown) => {
  const err = e instanceof TjError ? e : new TjError(e instanceof Error ? e.message : String(e));
  if (!(e instanceof TjError)) ui.debug((e as Error)?.stack ?? '');
  emitError(err);
  process.exitCode = err.code;
});
