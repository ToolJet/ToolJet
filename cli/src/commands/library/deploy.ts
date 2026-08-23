import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/library/auth';
import { build } from '../../lib/library/builder';
import { ApiClient } from '../../lib/library/api-client';
import { ProjectConfig, ProjectConfigData } from '../../lib/library/project-config';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class ComponentDeploy extends Command {
  static description = 'Build and publish a new immutable production revision of a component library';

  static aliases = ['lib:deploy'];

  static examples = [
    `$ tooljet library deploy`,
    `$ tooljet library deploy --message "Add dark mode support"`,
    `$ tooljet lib deploy`,
    `$ tooljet lib deploy --message "Add dark mode support"`,
  ];

  static flags = {
    message: Flags.string({ description: 'Optional label for the revision (shown in app builder revision picker)' }),
    force: Flags.boolean({
      description: 'Publish even if the build reports TypeScript errors',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ComponentDeploy);
    const { message, force } = flags;

    const { workspaceId, apiToken, url } = Auth.resolveOrExit();
    const config = this.readConfigOrExit();

    const currentDir = process.cwd();
    const client = new ApiClient(url, apiToken);

    try {
      await client.verifyLibrary(config.libraryId);

      this.log(`Building your component library...\n`);

      const result = await build(currentDir, { env: 'production' });

      this.log(formatSuccess(`Manifest generated: dist/manifest.json (${result.componentCount} components)`));
      this.log(formatSuccess(`Bundle built: dist/index.js (${result.bundleSizeKb} KB)`));

      if (result.hasCss) this.log(formatSuccess(`CSS output: dist/index.css (${result.cssSizeKb} KB)`));

      const tsCompiledMsg = `TypeScript compiled (${result.tsErrors} errors)`;
      result.tsErrors === 0 && this.log(formatSuccess(tsCompiledMsg));
      
      if (result.tsErrors > 0 && !force) {
        this.log(formatError(tsCompiledMsg));
        this.log(`\n${result.tsErrorReport}`);
        this.log(
          formatError(
            `Aborting - build reported ${result.tsErrors} TypeScript error(s). Fix them, or re-run with --force to publish anyway.`
          )
        );
        process.exit(1);
      }

      this.log(formatSuccess(`Built successfully in ${formatDuration(result.buildMs)}`));

      this.log('\nUploading build to server...');

      const revision = await client.publishRevision(config.libraryId, result.distDir, message);

      this.log(formatSuccess(`\nPublished as ${revision.version} on ${workspaceId} workspace\n`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  private readConfigOrExit(): ProjectConfigData {
    try {
      return ProjectConfig.read();
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
