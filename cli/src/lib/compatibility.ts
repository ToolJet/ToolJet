import fetch = require('node-fetch');

/*
  The CLI and the ToolJet server release separately, so each checks the other before a command uses the server:

  - The server says the oldest CLI it works with (minCliVersion). It raises that when it changes or drops something
    an older CLI relies on, and an older CLI then asks the user to upgrade the CLI.
  - The server also says which CLI API it speaks (cliApiVersion): a whole number it raises when it adds or changes
    something a CLI release relies on. This CLI needs at least MIN_SERVER_CLI_API, and asks the user to upgrade ToolJet
    when the server is behind.

  The server side is a whole number, not a minimum ToolJet version, because ToolJet ships several release lines at
  once (an LTS line and the latest line, betas between): a feature backported to the LTS line brings the number with
  it, where a minimum ToolJet version would be wrong for one of the lines.

  The check runs once per server per command, before the first request. A server that predates it (404) is too old.
  A server it cannot reach, or that fails, is not judged here: the command's own request reports that.
  TOOLJET_SKIP_VERSION_CHECK=1 turns it off (a local CLI against a local server in development).
*/

/** Raise to the server's cliApiVersion that brought what this CLI needs (server/src/modules/app/constants/cli-compatibility.ts). */
export const MIN_SERVER_CLI_API = 1;

export const SKIP_VERSION_CHECK_ENV = 'TOOLJET_SKIP_VERSION_CHECK';

export const COMPATIBILITY_PATH = '/api/cli-compatibility';

export const CLI_PACKAGE = '@tooljet/cli';

// From src/lib (ts-node) and dist/lib (the build) alike.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const CLI_VERSION: string = require('../../package.json').version;

export interface ServerCompatibility {
  serverVersion?: string;
  cliApiVersion: number;
  minCliVersion: string;
}

export class VersionMismatchError extends Error {}

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** Semver order of a and b: negative when a is older. A version that does not parse orders as equal (never blocks). */
export function compareVersions(a: string, b: string): number {
  const x = SEMVER.exec(a.trim());
  const y = SEMVER.exec(b.trim());
  if (!x || !y) return 0;
  for (let i = 1; i <= 3; i++) {
    const diff = Number(x[i]) - Number(y[i]);
    if (diff) return diff;
  }
  // A prerelease is older than its release: 1.0.0-beta.1 < 1.0.0.
  if (!x[4] || !y[4]) return (x[4] ? -1 : 0) + (y[4] ? 1 : 0);
  const left = x[4].split('.');
  const right = y[4].split('.');
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] === undefined) return -1;
    if (right[i] === undefined) return 1;
    const numeric = /^\d+$/.test(left[i]) && /^\d+$/.test(right[i]);
    const diff = numeric ? Number(left[i]) - Number(right[i]) : left[i].localeCompare(right[i]);
    if (diff) return diff;
  }
  return 0;
}

const serverCli = (url: string) => `npm i -g ${url}/api/code-mode/cli/tooljet-cli.tgz`;

const upgradeCli = (url: string, needs: string) =>
  `This ToolJet CLI (${CLI_VERSION}) is too old for ${url}, which needs ${needs} or later. ` +
  `Upgrade it with: npm i -g ${CLI_PACKAGE}@latest`;

const upgradeServer = (url: string, serverVersion?: string) =>
  `ToolJet at ${url}${serverVersion ? ` (${serverVersion})` : ''} is too old for this ToolJet CLI (${CLI_VERSION}). ` +
  `Ask your admin to upgrade ToolJet, or install the CLI your ToolJet was built with, if it serves one: ${serverCli(
    url
  )}`;

/** The mismatch between this CLI and what the server reports, or undefined when they work together. */
export function mismatch(url: string, server: ServerCompatibility): string | undefined {
  if (typeof server.minCliVersion === 'string' && compareVersions(CLI_VERSION, server.minCliVersion) < 0)
    return upgradeCli(url, server.minCliVersion);
  if (typeof server.cliApiVersion === 'number' && server.cliApiVersion < MIN_SERVER_CLI_API)
    return upgradeServer(url, server.serverVersion);
  return undefined;
}

async function check(url: string): Promise<void> {
  let res: import('node-fetch').Response;
  try {
    res = await fetch(`${url}${COMPATIBILITY_PATH}`, { method: 'GET', redirect: 'follow', timeout: 10000 });
  } catch {
    return; // unreachable: the command's own request says so
  }
  if (res.status === 404) throw new VersionMismatchError(upgradeServer(url));
  if (!res.ok) return;
  let server: ServerCompatibility;
  try {
    server = (await res.json()) as ServerCompatibility;
  } catch {
    return;
  }
  const problem = server && typeof server === 'object' ? mismatch(url, server) : undefined;
  if (problem) throw new VersionMismatchError(problem);
}

const checked = new Map<string, Promise<void>>();

/** Throws VersionMismatchError when this CLI and the server at url do not work together; checks each server once. */
export function ensureCompatible(url: string): Promise<void> {
  if (process.env[SKIP_VERSION_CHECK_ENV] === '1') return Promise.resolve();
  const key = url.replace(/\/+$/, '');
  let pending = checked.get(key);
  if (!pending) {
    pending = check(key);
    checked.set(key, pending);
  }
  return pending;
}

/** Forget earlier checks (tests). */
export const resetCompatibilityChecks = () => checked.clear();
