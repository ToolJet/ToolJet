import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../lib/component/auth';
import { ApiClient } from '../lib/component/api-client';

export default class Login extends Command {
  static description = 'Authenticate the CLI against a ToolJet workspace';

  static examples = [`$ tooljet login`];

  async run(): Promise<void> {
    const answers: any = await inquirer.prompt([
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

    const { workspace_id: workspaceId, api_access_token: apiToken } = answers;

    const client = new ApiClient(apiToken);
    const me = await client.fetchProfile();

    Auth.save(workspaceId, apiToken, me.email);

    this.log(`✓ Authenticated as ${me.email}`);
    this.log(`✓ Saved credentials for ${workspaceId} workspace`);
  }
}
