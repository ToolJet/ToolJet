import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/component/auth';
import { build } from '../../lib/component/builder';
import { ApiClient } from '../../lib/component/api-client';
import { ProjectConfig, ProjectConfigData } from '../../lib/component/project-config';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

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

    const { workspaceId, apiToken } = Auth.resolveOrExit();
    const config = this.readConfigOrExit();

    const currentDir = process.cwd();
    const client = new ApiClient(apiToken);

    try {
      await client.verifyLibrary(config.libraryId);

      this.log(`Building your component library...\n`);

      const result = await build(currentDir, { env: 'production' });

      this.log(formatSuccess(`Manifest generated: dist/manifest.json (${result.componentCount} components)`));
      this.log(formatSuccess(`Bundle built: dist/index.js (${result.bundleSizeKb} KB)`));

      if (result.hasCss) this.log(formatSuccess(`CSS output: dist/index.css (${result.cssSizeKb} KB)`));

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
