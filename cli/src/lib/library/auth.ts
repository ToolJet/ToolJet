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
  workspaces: Record<string, { url: string; apiToken: string; email: string }>;
  default: string;
}

export class Auth {
  static save(workspaceId: string, url: string, apiToken: string, email: string): void {
    const creds = Auth.readStore();
    creds.workspaces[workspaceId] = { url, apiToken, email };
    creds.default = workspaceId;

    fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
    // writeFileSync only applies `mode` when creating the file, so a pre-existing
    // file with looser permissions would otherwise keep them.
    fs.chmodSync(CREDENTIALS_PATH, 0o600);
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

    const { apiToken, url } = creds.workspaces[workspaceId];

    return { workspaceId, apiToken, url };
  }

  private static readWorkspace(workspaceId: string): { workspaceId: string; apiToken: string; url: string } | null {
    const creds = Auth.readStore();
    if (!creds.workspaces[workspaceId]) return null;

    const { apiToken, url } = creds.workspaces[workspaceId];

    return { workspaceId, apiToken, url };
  }
}
