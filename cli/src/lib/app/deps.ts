import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/*
  Installing an app project's dependencies never runs package lifecycle scripts (preinstall, install, postinstall,
  prepare): a dependency's install script runs with the developer's or the agent's full access, which is how most
  npm supply-chain attacks start. Code pages are browser code, and their libraries do not need build steps at
  install time; the CLI builds with its own esbuild.

  Every install the CLI or the agent runs goes through here. New projects also get frontend/.npmrc with
  `ignore-scripts=true`, so a plain `npm install` (or pnpm, which reads it too) behaves the same.
*/

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'yarn-berry';

export const LOCKFILES: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
};

export function findLockfile(frontend: string): string | null {
  return Object.keys(LOCKFILES).find((f) => fs.existsSync(path.join(frontend, f))) ?? null;
}

export function detectPackageManager(frontend: string): PackageManager {
  const lock = findLockfile(frontend);
  if (!lock) return 'npm';
  const pm = LOCKFILES[lock];
  if (pm === 'yarn' && fs.existsSync(path.join(frontend, '.yarnrc.yml'))) return 'yarn-berry';
  return pm;
}

export interface InstallCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

/**
 * The install command for a package manager, scripts off. `frozen` installs exactly the lockfile (publish, CI):
 * the lockfile is not rewritten and a mismatch with package.json fails.
 */
export function installCommand(pm: PackageManager, frozen: boolean): InstallCommand {
  // Belt and braces: the flag, plus the environment setting each tool reads, in case a project config overrides it.
  // NODE_ENV=development too: under production (the MCP server sets it for oclif) every package manager drops
  // devDependencies, and the build needs them (Tailwind, PostCSS, autoprefixer).
  const env = { npm_config_ignore_scripts: 'true', NODE_ENV: 'development' };
  switch (pm) {
    case 'pnpm':
      return { command: 'pnpm', args: ['install', '--ignore-scripts', ...(frozen ? ['--frozen-lockfile'] : [])], env };
    case 'yarn':
      return { command: 'yarn', args: ['install', '--ignore-scripts', '--non-interactive', ...(frozen ? ['--frozen-lockfile'] : [])], env };
    case 'yarn-berry':
      // Yarn 2+ has no --ignore-scripts flag; enableScripts is its setting.
      return { command: 'yarn', args: ['install', ...(frozen ? ['--immutable'] : [])], env: { ...env, YARN_ENABLE_SCRIPTS: 'false' } };
    default:
      return frozen
        ? { command: 'npm', args: ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], env }
        : { command: 'npm', args: ['install', '--ignore-scripts', '--no-audit', '--no-fund'], env };
  }
}

export const formatCommand = (c: InstallCommand) => [c.command, ...c.args].join(' ');

export class LockfileMissingError extends Error {
  constructor(frontend: string) {
    super(
      `No lockfile in ${path.basename(frontend)}/ (package-lock.json, pnpm-lock.yaml or yarn.lock). Publishing needs one, so the ` +
        'published app is built from exactly the dependency versions you tested. Run `tooljet app install` and commit the lockfile.'
    );
  }
}

export function requireLockfile(frontend: string): string {
  const lock = findLockfile(frontend);
  if (!lock) throw new LockfileMissingError(frontend);
  return lock;
}

export const needsInstall = (frontend: string) => !fs.existsSync(path.join(frontend, 'node_modules'));

export type Runner = (command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => { status: number | null; error?: Error };

const defaultRunner: Runner = (command, args, options) =>
  spawnSync(command, args, { ...options, stdio: 'inherit', shell: process.platform === 'win32' });

/** Installs the project's dependencies with scripts off. Returns the command it ran. */
export function installDependencies(
  frontend: string,
  options: { frozen?: boolean; run?: Runner; command?: InstallCommand } = {}
): InstallCommand {
  const cmd = options.command ?? installCommand(detectPackageManager(frontend), !!options.frozen && !!findLockfile(frontend));
  const result = (options.run ?? defaultRunner)(cmd.command, cmd.args, { cwd: frontend, env: { ...process.env, ...cmd.env } });
  if (result.error) throw new Error(`Could not run ${cmd.command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${formatCommand(cmd)} failed (exit ${result.status}).`);
  return cmd;
}
