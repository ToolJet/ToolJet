import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CREDENTIALS_PATH = path.join(os.homedir(), '.tooljet', 'credentials.json');

export interface ResolvedAuth {
  instanceUrl: string;
  apiToken: string;
}

export class Auth {
  static save(instanceUrl: string, apiToken: string, email: string): void {
    const creds = Auth.readOrEmpty();
    creds.instances[instanceUrl] = { apiToken, email };
    creds.defaultInstance = instanceUrl;

    fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
  }

  static resolve(flags: { url?: string; token?: string } = {}): ResolvedAuth {
    const creds = Auth.readDefault();
    if (!creds) throw new Error('Not authenticated. Run: tooljet login');

    return { instanceUrl: creds.instanceUrl, apiToken: creds.apiToken };
  }

  private static readOrEmpty() {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch {
      return { instances: {}, defaultInstance: '' };
    }
  }

  private static readDefault(): { instanceUrl: string; apiToken: string } | null {
    const creds = Auth.readOrEmpty();
    const url = creds.defaultInstance;

    if (!url || !creds.instances[url]) return null;

    return { instanceUrl: url, apiToken: creds.instances[url].apiToken };
  }
}