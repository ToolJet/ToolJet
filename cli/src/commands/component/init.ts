import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';
import * as fs from 'fs';

import { Auth } from '../../lib/component/auth';
import { ApiClient } from '../../lib/component/api-client';
import { scaffoldProject } from '../../lib/component/scaffolder';

export default class ComponentInit extends Command {
  static description = 'Initialize a new custom component library';

  static examples = [`$ tooljet component init <library_directory_name>`];

  static args = [
    { name: 'library_directory_name', description: 'Directory name for the new component library', required: true },
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(ComponentInit);
    const libraryDirectoryName = args.library_directory_name;

    if (Number(libraryDirectoryName)) {
      this.log('\x1b[41m%s\x1b[0m', 'Error : Library directory name can not be a number');
      process.exit(1);
    }

    if (fs.existsSync(libraryDirectoryName)) {
      this.log('\x1b[41m%s\x1b[0m', `Error : Directory "${libraryDirectoryName}" already exists`);
      process.exit(1);
    }

    const answers: any = await inquirer.prompt([
      {
        name: 'display_name',
        message: 'Component library display name',
        type: 'input',
        validate: (input: string) => (input && input.trim().length > 0) || 'Display name is required',
      },
      {
        name: 'instance_url',
        message: 'ToolJet instance URL',
        type: 'input',
        default: this.getDefaultInstanceUrl(),
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Enter a valid URL';
          }
        },
      },
    ]);

    const { display_name: displayName, instance_url: instanceUrl } = answers;

    const { apiToken } = Auth.resolve();

    const client = new ApiClient(instanceUrl, apiToken);

    const library = await client.createLibrary(displayName);

    // Scaffold project via hygen templates
    await scaffoldProject(libraryDirectoryName, { instanceUrl, libraryId: library.id, libraryName: library.name });

    this.log(`✓ Registered library "${displayName}" on ${instanceUrl} (ID: ${library.id})`);
    this.log(`✓ Created project directory: ./${libraryDirectoryName}/`);
    this.log(`✓ Run: cd ${libraryDirectoryName} && npm install`);
  }

  private getDefaultInstanceUrl(): string {
    return 'https://app.tooljet.ai';
  }
}
