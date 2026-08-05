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
        validate: (input: string) => {
          if (!input || input.trim().length === 0) return 'Display name is required';

          if (!/^[A-Za-z][A-Za-z0-9 ]*$/.test(input.trim())) {
            return 'The display name must only contain letters and numbers, and must start with a letter. Spaces are allowed';
          }

          return true;
        },
      }
    ]);

    const { display_name: displayName } = answers;

    const { workspaceId, apiToken } = Auth.resolveOrExit();

    const client = new ApiClient(apiToken);

    let library: { id: string; name: string };
    try {
      library = await client.createLibrary(displayName);
    } catch (err) {
      this.log('\x1b[41m%s\x1b[0m', `Error : ${(err as Error).message}`);
      process.exit(1);
    }

    // Scaffold project via hygen templates
    await scaffoldProject(libraryDirectoryName, { workspaceId, libraryId: library.id, libraryName: library.name });

    this.log(`✓ Registered library "${displayName}" on ${workspaceId} workspace (ID: ${library.id})`);
    this.log(`✓ Created project directory: ./${libraryDirectoryName}/`);
    this.log(`✓ Run: cd ${libraryDirectoryName} && npm install`);
  }
}
