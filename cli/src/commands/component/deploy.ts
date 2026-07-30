import { Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';

import { Auth } from '../../lib/component/auth';
import { build } from '../../lib/component/builder';
import { ApiClient } from '../../lib/component/api-client';

export default class ComponentDeploy extends Command {
  static description =
    'Build and publish a new immutable production revision of a component library';

  static examples = [
    `$ tooljet component deploy`,
    `$ tooljet component deploy --message "Add dark mode support"`,
  ];

  static flags = {
    message: Flags.string({ description: 'Optional label for the revision (shown in app builder revision picker)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ComponentDeploy);
    const { message } = flags;

    const { instanceUrl, apiToken } = Auth.resolve();
    const client = new ApiClient(instanceUrl, apiToken);

    const configPath = path.join(process.cwd(), '.tooljet', 'config.json');
    if (!fs.existsSync(configPath)) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        'Error : .tooljet/config.json not found. Run this command from a component library directory created with `tooljet component init`.'
      );
      process.exit(1);
    }
    const { libraryId } = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    this.log('Building...');
    const result = await build(process.cwd());

    this.log('Uploading...');
    const revision = await client.publishRevision(libraryId, result.distDir, message);

    this.log(`✓ Built in ${result.buildMs}ms`);
    this.log(`✓ Published as ${revision.version} on ${instanceUrl}`);
    this.log(`  Bundle URL: ${revision.bundleUrl}`);
    this.log(`  Revision ID: ${revision.id}`);
  }
}
