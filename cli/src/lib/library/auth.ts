import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { formatError } from '../log';

const CREDENTIALS_PATH = path.join(os.homedir(), '.tooljet', 'credentials.json');

export interface ResolvedAuth {
  workspaceId: string;
  apiToken: string;
  url: string;
}

interface CredentialsStore {
  /** Keyed by workspace id (or `<id>@<origin>` when that id is already stored for another instance). */
  workspaces: Record<string, { url: string; apiToken: string; email: string; workspaceId?: string }>;
  default: string;
  /** The login each instance (origin) uses: the workspace last signed in there. */
  instances?: Record<string, string>;
}

export interface SaveResult {
  /** The new login is now the default one. */
  isDefault: boolean;
  /** The default login's instance after the save. */
  defaultUrl: string;
}

const originOf = (url: string | undefined): string | undefined => {
  if (typeof url !== 'string') return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
};

/** What a login that did not become the default says, so the switch it did not make is never a surprise. */
export const keptDefaultNote = (origin: string, defaultUrl: string): string =>
  `Your default login is still ${new URL(defaultUrl).origin}. Projects cloned from ${origin} use this login; ` +
  `elsewhere, add --instance ${origin} to a command, or run tooljet auth login --url ${origin} --default to make it the default.`;

/*
  One login per instance and workspace. A login never silently replaces the default when the default is another
  instance: projects remember their instance (.tooljet/instance.json) and use its login, so signing in to a second
  instance (for example from an "Open in VS Code" link) leaves the commands run in every other folder where they were.
  `makeDefault` (tooljet auth login --default) switches it on purpose.
*/
export class Auth {
  static save(
    workspaceId: string,
    url: string,
    apiToken: string,
    email: string,
    options: { makeDefault?: boolean } = {}
  ): SaveResult {
    const creds = Auth.readStore();
    const origin = originOf(url) ?? url;
    const current = creds.default ? creds.workspaces[creds.default] : undefined;
    const currentOrigin = originOf(current?.url);
    // Workspace ids come from the server that answered, so the same id from another instance is kept apart rather
    // than overwriting (and, were it the default, redirecting) the login it collides with.
    const existing = creds.workspaces[workspaceId];
    const key = existing && originOf(existing.url) !== origin ? `${workspaceId}@${origin}` : workspaceId;
    creds.workspaces[key] = { url, apiToken, email, ...(key !== workspaceId ? { workspaceId } : {}) };
    creds.instances = { ...(creds.instances ?? {}), [origin]: key };
    const makeDefault = options.makeDefault ?? (!currentOrigin || currentOrigin === origin);
    if (makeDefault) creds.default = key;

    fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
    // writeFileSync only applies `mode` when creating the file, so a pre-existing
    // file with looser permissions would otherwise keep them.
    fs.chmodSync(CREDENTIALS_PATH, 0o600);
    return { isDefault: makeDefault, defaultUrl: makeDefault ? url : (current?.url as string) };
  }

  /** The stored login for one instance (an origin): the workspace last signed in there, else any login for it. */
  static forOrigin(origin: string): ResolvedAuth | null {
    const creds = Auth.readStore();
    const wanted = originOf(origin);
    if (!wanted) return null;
    const matches = (key: string | undefined) => !!key && !!creds.workspaces[key] && originOf(creds.workspaces[key].url) === wanted;
    const key = [creds.instances?.[wanted], creds.default, ...Object.keys(creds.workspaces)].find(matches);
    if (!key) return null;
    const entry = creds.workspaces[key];
    return { workspaceId: entry.workspaceId ?? key, apiToken: entry.apiToken, url: entry.url };
  }

  /** The default login's instance (origin), if there is a default login. */
  static defaultOrigin(): string | undefined {
    return originOf(Auth.readDefault()?.url);
  }

  static resolve(flags: { url?: string; token?: string; workspaceId?: string } = {}): ResolvedAuth {
    const creds = flags.workspaceId ? Auth.readWorkspace(flags.workspaceId) : Auth.readDefault();
    if (!creds) {
      throw new Error(
        flags.workspaceId
          ? `Not authenticated for workspace ${flags.workspaceId}. Run: tooljet login`
          : 'Not authenticated. Run: tooljet login'
      );
    }

    return {
      workspaceId: creds.workspaceId,
      apiToken: flags.token ?? creds.apiToken,
      url: flags.url ?? creds.url,
    };
  }

  // Same as resolve(), but prints the standard CLI error message and exits
  // instead of throwing, so callers don't need to repeat that handling.
  static resolveOrExit(flags: { url?: string; token?: string; workspaceId?: string } = {}): ResolvedAuth {
    try {
      return Auth.resolve(flags);
    } catch (err) {
      console.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  private static readStore(): CredentialsStore {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { workspaces: {}, default: '' };
      }
      throw err;
    }
  }

  private static readDefault(): { workspaceId: string; apiToken: string; url: string } | null {
    const creds = Auth.readStore();
    const workspaceId = creds.default;

    if (!workspaceId || !creds.workspaces[workspaceId]) return null;

    const { apiToken, url, workspaceId: id } = creds.workspaces[workspaceId];

    return { workspaceId: id ?? workspaceId, apiToken, url };
  }

  private static readWorkspace(workspaceId: string): { workspaceId: string; apiToken: string; url: string } | null {
    const creds = Auth.readStore();
    if (!creds.workspaces[workspaceId]) return null;

    const { apiToken, url, workspaceId: id } = creds.workspaces[workspaceId];

    return { workspaceId: id ?? workspaceId, apiToken, url };
  }
}
