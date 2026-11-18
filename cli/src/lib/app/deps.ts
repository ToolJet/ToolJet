import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { isServerMode } from '../server-mode';
import { assertRegistryOnlyProject, linksOutOfProject } from './dependency-specs';

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
  // A project's choice of tool is a project's config (yarn's .yarnrc.yml can name a script to run): the server uses npm.
  if (isServerMode()) return 'npm';
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
      return {
        command: 'yarn',
        args: ['install', '--ignore-scripts', '--non-interactive', ...(frozen ? ['--frozen-lockfile'] : [])],
        env,
      };
    case 'yarn-berry':
      // Yarn 2+ has no --ignore-scripts flag; enableScripts is its setting.
      return {
        command: 'yarn',
        args: ['install', ...(frozen ? ['--immutable'] : [])],
        env: { ...env, YARN_ENABLE_SCRIPTS: 'false' },
      };
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
      `No lockfile in ${path.basename(
        frontend
      )}/ (package-lock.json, pnpm-lock.yaml or yarn.lock). Publishing needs one, so the ` +
        'published app is built from exactly the dependency versions you tested. Run `tooljet app install` and commit the lockfile.'
    );
  }
}

export function requireLockfile(frontend: string): string {
  const lock = findLockfile(frontend);
  if (!lock) throw new LockfileMissingError(frontend);
  return lock;
}

/*
  What is installed has to be what the lockfile says, or the scan reads one set of packages and the build bundles another
  (a stale copy, or stored code that moved the lockfile on). npm records what it installed in node_modules/.package-lock.json.
  The SDK can be installed over the lockfile on purpose (lib/app/sdk.ts), so it is not compared.
*/
const readJson = (file: string): Record<string, any> | undefined => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};

/** Why node_modules does not match package-lock.json, or undefined when it does. Only npm's lockfile can be compared. */
export function lockMismatch(frontend: string): string | undefined {
  const lock = readJson(path.join(frontend, 'package-lock.json'))?.packages as Record<string, any> | undefined;
  if (!lock) return undefined;
  const installed = readJson(path.join(frontend, 'node_modules', '.package-lock.json'))?.packages as
    | Record<string, any>
    | undefined;
  const compared = (key: string) =>
    key.startsWith('node_modules/') && key !== 'node_modules/@tooljet/custom-component-sdk';
  if (!installed) return Object.keys(lock).some(compared) ? 'nothing records what is installed' : undefined;
  for (const [key, entry] of Object.entries(lock)) {
    if (!compared(key)) continue;
    const have = installed[key];
    if (!have) {
      if (entry.optional || entry.peer) continue; // another platform's build of a package
      return `${key} is not installed`;
    }
    if (entry.version !== have.version) return `${key} is ${have.version}, the lockfile says ${entry.version}`;
    if (entry.integrity && have.integrity && entry.integrity !== have.integrity)
      return `${key} differs from the lockfile`;
    const onDisk = readJson(path.join(frontend, key, 'package.json'));
    if (entry.version && onDisk && onDisk.version !== entry.version)
      return `${key} on disk is ${onDisk.version}, the lockfile says ${entry.version}`;
  }
  for (const key of Object.keys(installed)) {
    if (compared(key) && !lock[key]) return `${key} is installed but not in the lockfile`;
  }
  return undefined;
}

export const needsInstall = (frontend: string) => !fs.existsSync(path.join(frontend, 'node_modules'));

export type Runner = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
) => { status: number | null; error?: Error };

const defaultRunner: Runner = (command, args, options) =>
  spawnSync(command, args, { ...options, stdio: 'inherit', shell: process.platform === 'win32' });

/** Installs the project's dependencies with scripts off. Returns the command it ran. */
export function installDependencies(
  frontend: string,
  options: { frozen?: boolean; run?: Runner; command?: InstallCommand } = {}
): InstallCommand {
  const cmd =
    options.command ?? installCommand(detectPackageManager(frontend), !!options.frozen && !!findLockfile(frontend));
  const run = () => (options.run ?? defaultRunner)(cmd.command, cmd.args, { cwd: frontend, env: installEnv(cmd) });
  // In server mode the project is anyone's with edit access: registry packages only (dependency-specs.ts).
  if (isServerMode()) assertRegistryOnlyProject(frontend);
  const result = isServerMode() ? withoutProjectNpmrc(frontend, run) : run();
  if (result.error) throw new Error(`Could not run ${cmd.command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${formatCommand(cmd)} failed (exit ${result.status}).`);
  if (isServerMode()) {
    const links = linksOutOfProject(frontend);
    if (links.length) {
      fs.rmSync(path.join(frontend, 'node_modules'), { recursive: true, force: true });
      throw new Error(`The install linked ${links.slice(0, 3).join(', ')} outside the project, so node_modules was removed.`);
    }
  }
  return cmd;
}

/** A package manager has no use for ToolJet's credentials, so in server mode it never sees them. */
const installEnv = (cmd: InstallCommand): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env, ...cmd.env };
  if (isServerMode()) for (const name of ['TOOLJET_PAT', 'TOOLJET_TOKEN', 'TOOLJET_SESSION_TOKEN']) delete env[name];
  return env;
};

/*
  A project's .npmrc can name the registry, auth tokens and the shell npm runs. npm reads it from the project's folder
  and nothing turns that off, so in server mode the file is held in memory during the install, the template's stands in,
  and the project's goes back after. The registry comes from the server's environment (npm_config_registry).
*/
function withoutProjectNpmrc<T>(frontend: string, run: () => T): T {
  const file = path.join(frontend, '.npmrc');
  const own = fs.existsSync(file) ? fs.readFileSync(file) : undefined;
  fs.writeFileSync(file, 'ignore-scripts=true\n');
  try {
    return run();
  } finally {
    if (own) fs.writeFileSync(file, own);
    else fs.rmSync(file, { force: true });
  }
}
