import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../lib/library/auth';
import { ApiClient } from '../lib/library/api-client';
import { formatError } from '../lib/log';

export default class Login extends Command {
  static description = 'Authenticate the CLI against a ToolJet workspace';

  static examples = [`$ tooljet login`];

  async run(): Promise<void> {
    const answers: any = await inquirer.prompt([
      {
        name: 'origin_url',
        message: 'ToolJet instance URL (e.g. https://app.tooljet.ai)',
        type: 'input',
        validate: (input: string) => {
          try {
            const { protocol } = new URL(input.trim());

            if (!['http:', 'https:'].includes(protocol)) throw new Error();

            return true;
          } catch {
            return 'Enter a valid URL, including the protocol (e.g. https://app.tooljet.ai)';
          }
        },
      },
      {
        name: 'workspace_id',
        message: 'ToolJet workspace ID',
        type: 'input',
        validate: (input: string) => {
          try {
            return input && input.trim().length > 0;
          } catch {
            return 'Workspace ID is required';
          }
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

    const { origin_url: originUrl, workspace_id: workspaceId, api_access_token: apiToken } = answers;

    const client = new ApiClient(originUrl.trim(), apiToken);

    let me: { email: string };
    try {
      me = await client.login();
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    Auth.save(workspaceId, originUrl.trim(), apiToken, me.email);

    this.log(`✓ Authenticated as ${me.email}`);
    // this.log(`✓ Saved credentials for ${workspaceId} workspace on ${originUrl.trim()}`);
  }
}
