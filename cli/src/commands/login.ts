import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../lib/library/auth';
import { ApiClient } from '../lib/library/api-client';
import { formatError } from '../lib/log';

// Plain HTTP is only safe to allow for loopback hosts (local ToolJet dev instances) —
// anything else would send the bearer API token over an unencrypted connection.
function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

export default class Login extends Command {
  static description = 'Authenticate the CLI against a ToolJet workspace';

  static examples = [`$ tooljet login`];

  async run(): Promise<void> {
    const answers: any = await inquirer.prompt([
      {
        name: 'origin_url',
        message: 'ToolJet origin URL (e.g. https://app.tooljet.ai)',
        type: 'input',
        validate: (input: string) => {
          let parsed: URL;
          try {
            parsed = new URL(input.trim());
          } catch {
            return 'Enter a valid URL, including the protocol (e.g. https://app.tooljet.ai)';
          }

          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return 'Enter a valid URL, including the protocol (e.g. https://app.tooljet.ai)';
          }

          if (parsed.protocol === 'http:' && !isLoopbackHost(parsed.hostname)) {
            return 'HTTP is only allowed for localhost/127.0.0.1 — use https:// for remote ToolJet instances';
          }

          return true;
        },
      },
      {
        name: 'api_access_token',
        message: 'API token (from your ToolJet profile → API tokens)',
        type: 'password',
        mask: '*',
        validate: (input: string) => (input && input.trim().length > 0) || 'API token is required',
      },
    ]);

    // Store just the origin (protocol + host + port) — a URL with a path, query,
    // or fragment would otherwise get concatenated with API paths downstream and
    // produce a broken request URL.
    const originUrl = new URL(answers.origin_url.trim()).origin;
    const apiToken = answers.api_access_token.trim();

    const client = new ApiClient(originUrl, apiToken);

    let me: { email: string; organizationId: string };
    try {
      me = await client.login();
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    Auth.save(me.organizationId, originUrl, apiToken, me.email);

    this.log(`✓ Authenticated as ${me.email}`);
    // this.log(`✓ Saved credentials for ${workspaceId} workspace on ${originUrl.trim()}`);
  }
}
