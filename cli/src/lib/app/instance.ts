import * as fs from 'fs';
import * as path from 'path';

import { Auth } from '../library/auth';
import { validateOriginUrl } from '../library/target-validation';
import { isServerMode } from '../server-mode';
import { resolveTarget, signedInServer, type Target } from './session';

/*
  Which ToolJet instance a project belongs to. `tooljet app clone` (and `init --create`) record the instance the app
  came from in .tooljet/instance.json, and every app command run in that project then uses that instance's stored
  login, whatever the CLI's default login is. A project never follows the default to another instance: a command
  whose --url or TOOLJET_URL names another one is refused unless --instance names it too, and a project whose
  instance has no stored login asks for a sign-in there instead of using the default.

  The file is local to the checkout: a pull never writes it (it is not a stored source path) and the template's
  .gitignore keeps it out of the repository, so one developer's instance does not bind another's clone.
*/

export const INSTANCE_FILE = path.join('.tooljet', 'instance.json');

const originOf = (url: string): string => new URL(url).origin;

/** The instance (an origin) this project belongs to, if it records one. */
export function readProjectInstance(root: string): string | undefined {
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(path.join(root, INSTANCE_FILE), 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw new Error(`${INSTANCE_FILE} is not valid JSON: ${(err as Error).message}`);
  }
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== 'string' || validateOriginUrl(url) !== true) {
    throw new Error(`${INSTANCE_FILE} does not name a ToolJet instance ("url": "https://..."). Clone the app again, or fix the file.`);
  }
  return originOf(url);
}

export function writeProjectInstance(root: string, url: string): void {
  fs.mkdirSync(path.join(root, '.tooljet'), { recursive: true });
  fs.writeFileSync(path.join(root, INSTANCE_FILE), JSON.stringify({ url: originOf(url) }, null, 2) + '\n');
}

export interface TargetFlags {
  url?: string;
  token?: string;
  /** Use this instance's stored login (or check --url names it), even where the project belongs to another. */
  instance?: string;
}

const parseInstanceFlag = (value: string): string => {
  const valid = validateOriginUrl(value);
  if (valid !== true) throw new Error(`--instance: ${valid}`);
  return originOf(value.trim());
};

const explicitTarget = (flags: TargetFlags): boolean =>
  !!(
    flags.url ||
    flags.token ||
    process.env.TOOLJET_URL ||
    process.env.TOOLJET_PAT ||
    process.env.TOOLJET_TOKEN ||
    process.env.TOOLJET_SESSION_TOKEN
  );

const describeSource = (flags: TargetFlags) => (flags.url ? '--url' : 'TOOLJET_URL');

/**
 * The instance and token an app command uses. `root` is the project it runs in (omit it for `clone`, which creates
 * one). Order: --url/--token or the environment (checked against --instance and the project's instance), else the
 * stored login for --instance, else the stored login for the project's instance, else the default login.
 */
export function resolveAppTarget(flags: TargetFlags = {}, root?: string): Target {
  const wanted = flags.instance ? parseInstanceFlag(flags.instance) : undefined;
  const bound = root ? readProjectInstance(root) : undefined;

  if (explicitTarget(flags)) {
    const target = resolveTarget(flags);
    const origin = originOf(target.url);
    if (wanted && origin !== wanted) {
      throw new Error(`--instance is ${wanted} but ${describeSource(flags)} is ${origin}.`);
    }
    // The MCP server sets the environment for a server-mode build; the project's record is not a user's terminal.
    if (!wanted && bound && origin !== bound && !isServerMode() && target.kind !== 'session') {
      throw new Error(
        `This project belongs to ${bound}, but ${describeSource(flags)} is ${origin}. ` +
          `To run it against ${origin} anyway, add --instance ${origin}.`
      );
    }
    return target;
  }

  const instance = wanted ?? bound;
  if (instance) {
    const login = Auth.forOrigin(instance);
    if (login) return { url: login.url.replace(/\/+$/, ''), token: login.apiToken };
    const fallback = Auth.defaultOrigin();
    throw new Error(
      (wanted
        ? `The CLI is not signed in to ${instance}.`
        : `This project belongs to ${instance}, and the CLI is not signed in there.`) +
        ` Run: tooljet auth login --url ${instance}` +
        (!wanted && fallback && fallback !== instance
          ? ` (Your default login is ${fallback}; to use it for this project anyway, add --instance ${fallback}.)`
          : '')
    );
  }
  return resolveTarget(flags);
}

/** The server a project's dependency install asks for the SDK: its instance, else the signed-in one. */
export const projectServer = (root: string): string | undefined => readProjectInstance(root) ?? signedInServer();
