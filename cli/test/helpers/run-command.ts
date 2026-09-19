import * as path from 'path';
import * as sinon from 'sinon';
import { Config } from '@oclif/core';

export const CLI_ROOT = path.join(__dirname, '..', '..');

// Instantiates a command without invoking run() — used for commands like `dev`
// whose run() loops forever, so tests need direct access to methods/parsed flags
// instead of driving the command end-to-end via runCommand().
export async function instantiateCommand<C>(
  CommandClass: new (argv: string[], config: Config) => C,
  argv: string[] = []
): Promise<C> {
  // Config.load()'s declared return type is `Promise<IConfig | Config>` for legacy
  // compat, but it only ever actually resolves a real Config instance.
  const config = (await Config.load(CLI_ROOT)) as Config;
  return new CommandClass(argv, config);
}

export interface RunResult {
  stdout: string;
  exitCode: number | undefined;
}

class ExitSignal extends Error {}

// Runs an oclif Command class directly against its TS source (no `npm run build`
// needed — Command.run's Config.load only reads package.json metadata, it doesn't
// resolve dist/commands, since we already hold a direct class reference).
// Captures everything written to stdout and traps any process.exit(code) call so
// a command under test can never actually kill the test process.
export async function runCommand(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommandClass: { run: (argv?: string[], opts?: any) => PromiseLike<unknown> },
  argv: string[] = []
): Promise<RunResult> {
  const writeStub = sinon.stub(process.stdout, 'write').returns(true);
  let exitCode: number | undefined;
  const exitStub = sinon.stub(process, 'exit').callsFake(((code?: number) => {
    exitCode = code ?? 0;
    throw new ExitSignal();
  }) as unknown as typeof process.exit);

  try {
    await CommandClass.run(argv, CLI_ROOT);
  } catch (err) {
    if (!(err instanceof ExitSignal)) throw err;
  } finally {
    writeStub.restore();
    exitStub.restore();
  }

  const stdout = writeStub
    .getCalls()
    .map((c) => c.args[0])
    .join('');

  return { stdout, exitCode };
}
