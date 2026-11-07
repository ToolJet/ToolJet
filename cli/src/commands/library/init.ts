import { Command, Flags } from '@oclif/core';
import { randomUUID } from 'crypto';
import * as inquirer from 'inquirer';
import * as fs from 'fs';

import { Auth } from '../../lib/library/auth';
import { ApiClient } from '../../lib/library/api-client';
import { scaffoldTemplate, writeLibraryConfig, TEMPLATES, TemplateName } from '../../lib/library/scaffolder';
import { formatError, formatSuccess } from '../../lib/log';

interface InitAnswers {
  display_name: string;
}

const MAX_DISPLAY_NAME_LENGTH = 100;

const validateDisplayName = (displayName: string): string | true => {
  if (displayName.length === 0) return 'Display name is required';
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH)
    return `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`;
  if (!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(displayName)) {
    return 'Display name must start with a letter and contain only letters, numbers, spaces, hyphens, and underscores';
  }
  return true;
};

export default class ComponentInit extends Command {
  static description = 'Initialize a new custom component library';

  static aliases = ['lib:init'];

  static examples = [
    `$ tooljet library init <library_directory_name>`,
    `$ tooljet library init my-app --template code-app`,
    `$ tooljet library init my-app --template code-app --display-name "My app" --local`,
    `$ tooljet lib init <library_directory_name>`,
  ];

  static flags = {
    template: Flags.string({
      description:
        'Project template: `new` (a plain React component library) or `code-app` (a whole app on shadcn + Tailwind with react-router)',
      options: [...TEMPLATES],
      default: 'new',
    }),
    'display-name': Flags.string({ description: 'Library display name (skips the prompt)' }),
    local: Flags.boolean({
      description:
        'Scaffold only: no login and no library registered on a workspace (publish or dev registers it later)',
      default: false,
    }),
  };

  static args = [
    { name: 'library_directory_name', description: 'Directory name for the new component library', required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ComponentInit);
    const libraryDirectoryName = args.library_directory_name;
    const template = flags.template as TemplateName;
    const includeSource = template === 'code-app';

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

    const answers = flags['display-name']
      ? { display_name: flags['display-name'] }
      : await inquirer.prompt<InitAnswers>([
          {
            name: 'display_name',
            message: 'Component library display name',
            type: 'input',
            validate: (input: string) => validateDisplayName(input?.trim() ?? ''),
          },
        ]);

    const displayName = answers.display_name.trim();
    const nameError = validateDisplayName(displayName);
    if (nameError !== true) {
      this.log(formatError(nameError));
      process.exit(1);
    }

    if (flags.local) {
      try {
        await scaffoldTemplate(libraryDirectoryName, displayName, template);
        writeLibraryConfig(libraryDirectoryName, {
          libraryName: displayName,
          correlationId: randomUUID(),
          includeSource,
        });
      } catch (err) {
        fs.rmSync(libraryDirectoryName, { recursive: true, force: true });
        this.log(formatError((err as Error).message));
        process.exit(1);
      }
      this.log(
        formatSuccess(
          `Created project directory: ./${libraryDirectoryName}/ (${template} template, not registered on a workspace)`
        )
      );
      this.log(`\n\x1b[1mRun: cd ${libraryDirectoryName} && npm install && npm run lib:build\x1b[0m\n`);
      return;
    }

    const { workspaceId, apiToken, url } = Auth.resolveOrExit();

    // Scaffold locally first: this makes no remote calls, so any failure here
    // leaves nothing to clean up on the server.
    try {
      await scaffoldTemplate(libraryDirectoryName, displayName, template);
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
        libraryName: library.name,
        correlationId: library.correlationId,
        includeSource,
      });
    } catch (err) {
      this.log(
        formatError(
          `Library "${displayName}" (ID: ${
            library.correlationId
          }) was registered on ${workspaceId}, but writing ./${libraryDirectoryName}/.tooljet/config.json failed: ${
            (err as Error).message
          }. The project directory is otherwise valid — retry writing the config manually or contact support.`
        )
      );
      process.exit(1);
    }

    this.log(
      `\n${formatSuccess(
        `Registered library "${displayName}" on ${workspaceId} workspace (ID: ${library.correlationId})`
      )}`
    );
    this.log(formatSuccess(`Created project directory: ./${libraryDirectoryName}/`));
    this.log(`\n\x1b[1mRun: cd ${libraryDirectoryName} && npm install\x1b[0m\n`);
  }
}
