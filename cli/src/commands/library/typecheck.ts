import { Command, Flags } from '@oclif/core';

import { cssProblems, formatProblem, typeCheck } from '../../lib/library/type-check';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class Typecheck extends Command {
  static description =
    'Type-check the component library and parse its stylesheets without building (fast, incremental; nothing is uploaded)';

  static aliases = ['lib:typecheck'];

  static examples = [`$ tooljet library typecheck`, `$ tooljet library typecheck --json`];

  static flags = {
    json: Flags.boolean({ description: 'Print the problems as JSON', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Typecheck);
    try {
      const { problems, ms } = typeCheck(process.cwd());
      const css = cssProblems(process.cwd());
      if (flags.json) {
        this.log(JSON.stringify({ typescript_errors: problems.length, problems: [...problems, ...css], ms }));
      } else {
        const message = `TypeScript checked (${problems.length} errors) in ${formatDuration(ms)}`;
        this.log(problems.length ? formatError(message) : formatSuccess(message));
        for (const p of [...problems, ...css]) this.log(`${formatProblem(p)}\n`);
      }
      if (problems.length || css.length) process.exitCode = 1;
    } catch (err) {
      if (flags.json) this.log(JSON.stringify({ error: (err as Error).message }));
      else this.log(formatError((err as Error).message));
      process.exitCode = 1;
    }
  }
}
