import { Command } from '@oclif/core';
import * as inquirer from 'inquirer';
import * as fs from 'fs';

import { Auth } from '../../lib/library/auth';
import { ApiClient } from '../../lib/library/api-client';
import { scaffoldTemplate, writeLibraryConfig } from '../../lib/library/scaffolder';
import { formatError } from '../../lib/log';

interface InitAnswers {
  display_name: string;
}

export default class ComponentInit extends Command {
  static description = 'Initialize a new custom component library';

  static aliases = ['lib:init'];

  static examples = [`$ tooljet library init <library_directory_name>`, `$ tooljet lib init <library_directory_name>`];

  static args = [
    { name: 'library_directory_name', description: 'Directory name for the new component library', required: true },
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(ComponentInit);
    const libraryDirectoryName = args.library_directory_name;

    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(libraryDirectoryName)) {
      this.log(
        formatError(
          'Library directory name must start with a letter and contain only letters, numbers, hyphens, and underscores'
        )
      );
      process.exit(1);
    }

    if (fs.existsSync(libraryDirectoryName)) {
      this.log(formatError(`Directory "${libraryDirectoryName}" already exists`));
      process.exit(1);
    }

    const answers = await inquirer.prompt<InitAnswers>([
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
      },
    ]);

    const displayName = answers.display_name.trim();

    const { workspaceId, apiToken, url } = Auth.resolveOrExit();

    // Scaffold locally first: this makes no remote calls, so any failure here
    // leaves nothing to clean up on the server.
    try {
      await scaffoldTemplate(libraryDirectoryName, displayName);
    } catch (err) {
      fs.rmSync(libraryDirectoryName, { recursive: true, force: true });
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    const client = new ApiClient(url, apiToken);

    let library: { id: string; name: string; correlationId: string };
    try {
      library = await client.createLibrary(displayName);
    } catch (err) {
      fs.rmSync(libraryDirectoryName, { recursive: true, force: true });
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    try {
      writeLibraryConfig(libraryDirectoryName, {
        workspaceId,
        libraryId: library.id,
        libraryName: library.name,
        correlationId: library.correlationId,
      });
    } catch (err) {
      this.log(
        formatError(
          `Library "${displayName}" (ID: ${
            library.id
          }) was registered on ${workspaceId}, but writing ./${libraryDirectoryName}/.tooljet/config.json failed: ${
            (err as Error).message
          }. The project directory is otherwise valid — retry writing the config manually or contact support.`
        )
      );
      process.exit(1);
    }

    this.log(`✓ Registered library "${displayName}" on ${workspaceId} workspace (ID: ${library.id})`);
    this.log(`✓ Created project directory: ./${libraryDirectoryName}/`);
    this.log(`✓ Run: cd ${libraryDirectoryName} && npm install`);
  }
}
