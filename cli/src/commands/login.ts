import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../lib/component/auth';
import { ApiClient } from '../lib/component/api-client';

export default class Login extends Command {
  static description = 'Authenticate the CLI against a ToolJet instance';

  static examples = [`$ tooljet login`];

  async run(): Promise<void> {
    const answers: any = await inquirer.prompt([
      {
        name: 'instance_url',
        message: 'ToolJet instance URL',
        type: 'input',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Enter a valid URL';
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

    const { instance_url: instanceUrl, api_access_token: apiToken } = answers;

    const client = new ApiClient(instanceUrl, apiToken);
    const me = await client.fetchProfile();

    Auth.save(instanceUrl, apiToken, me.email);

    this.log(`✓ Authenticated as ${me.email}`);
    this.log(`✓ Saved credentials for ${instanceUrl}`);
  }
}
