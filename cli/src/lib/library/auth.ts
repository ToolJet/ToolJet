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

export class Auth {
  static save(workspaceId: string, url: string, apiToken: string, email: string): void {
    const creds = Auth.readOrEmpty();
    creds.workspaces[workspaceId] = { url, apiToken, email };
    creds.default = workspaceId;

    fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
  }

  static resolve(flags: { url?: string; token?: string } = {}): ResolvedAuth {
    const creds = Auth.readDefault();
    if (!creds) throw new Error('Not authenticated. Run: tooljet login');

    return {
      workspaceId: creds.workspaceId,
      apiToken: creds.apiToken,
      url: flags.url ?? creds.url,
    };
  }

  // Same as resolve(), but prints the standard CLI error message and exits
  // instead of throwing, so callers don't need to repeat that handling.
  static resolveOrExit(flags: { url?: string; token?: string } = {}): ResolvedAuth {
    try {
      return Auth.resolve(flags);
    } catch (err) {
      console.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  private static readOrEmpty() {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch {
      return { workspaces: {}, default: '' };
    }
  }

  private static readDefault(): { workspaceId: string; apiToken: string; url: string } | null {
    const creds = Auth.readOrEmpty();
    const workspaceId = creds.default;

    if (!workspaceId || !creds.workspaces[workspaceId]) return null;

    const { apiToken, url } = creds.workspaces[workspaceId];

    return { workspaceId, apiToken, url };
  }
}
