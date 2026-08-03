import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CREDENTIALS_PATH = path.join(os.homedir(), '.tooljet', 'credentials.json');

export interface ResolvedAuth {
  workspaceId: string;
  apiToken: string;
}

export class Auth {
  static save(workspaceId: string, apiToken: string, email: string): void {
    const creds = Auth.readOrEmpty();
    creds.workspaces[workspaceId] = { apiToken, email };
    creds.default = workspaceId;

    fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
  }

  static resolve(flags: { url?: string; token?: string } = {}): ResolvedAuth {
    const creds = Auth.readDefault();
    if (!creds) throw new Error('Not authenticated. Run: tooljet login');

    return { workspaceId: creds.workspaceId, apiToken: creds.apiToken };
  }

  private static readOrEmpty() {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch {
      return { workspaces: {}, default: '' };
    }
  }

  private static readDefault(): { workspaceId: string; apiToken: string } | null {
    const creds = Auth.readOrEmpty();
    const workspaceId = creds.default;

    if (!workspaceId || !creds.workspaces[workspaceId]) return null;

    return { workspaceId, apiToken: creds.workspaces[workspaceId].apiToken };
  }
}