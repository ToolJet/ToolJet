import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../lib/library/auth';
import { ApiClient } from '../lib/library/api-client';
import { validateOriginUrl, validateApiToken } from '../lib/library/target-validation';
import { formatError } from '../lib/log';

export default class Login extends Command {
  static description = 'Authenticate the CLI against a ToolJet workspace';

  static examples = [`$ tooljet login`];

  async run(): Promise<void> {
    const answers: any = await inquirer.prompt([
      {
        name: 'origin_url',
        message: 'ToolJet origin URL (e.g. https://app.tooljet.ai)',
        type: 'input',
        validate: validateOriginUrl,
      },
      {
        name: 'api_access_token',
        message: 'API token (from your ToolJet profile → API tokens)',
        type: 'password',
        mask: '*',
        validate: validateApiToken,
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
