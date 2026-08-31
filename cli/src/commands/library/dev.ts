import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/library/auth';
import { ApiClient } from '../../lib/library/api-client';
import { ProjectConfig, ProjectConfigData } from '../../lib/library/project-config';
import { DevWatcher } from '../../lib/library/dev-watcher';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class Dev extends Command {
  static description = 'Watch src/ and upload to the dev track on every save';

  static aliases = ['lib:dev'];

  static examples = [
    '$ tooljet library dev',
    '$ tooljet library dev --debounce 500',
    '$ tooljet lib dev',
    '$ tooljet lib dev --debounce 500',
  ];

  static flags = {
    debounce: Flags.integer({ description: 'Debounce ms between saves', default: 300 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Dev);

    const config = this.readConfigOrExit();
    const { workspaceId, apiToken, url } = Auth.resolveOrExit({ workspaceId: config.workspaceId });
    const client = new ApiClient(url, apiToken);

    try {
      await client.verifyLibrary(config.libraryId);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    this.log(formatSuccess(`Connected to ${workspaceId} workspace`));
    this.log(formatSuccess(`Library: ${config.libraryName} (dev track)\n`));
    this.log('Watching src/ for changes...\n');

    const watcher = DevWatcher.start({
      projectRoot: process.cwd(),
      debounceMs: flags.debounce,
      onRebuild: async (result) => {
        if ('error' in result) {
          this.log(`  ${formatError(`build failed - ${result.error.message}`)}`);
          return;
        }

        this.log(`  ${formatSuccess(`Built in ${formatDuration(result.buildMs)}`)}`);

        if (result.tsErrors > 0) {
          this.log(`  ${formatError(`TypeScript compiled (${result.tsErrors} errors)`)}`);
          this.log(`\n${result.tsErrorReport}`);
        }

        if (result.componentCount === 0) {
          this.log(`  ${formatError('Skipping upload - no components found in manifest.')}`);
          return;
        }

        try {
          await client.uploadDev(config.libraryId, result.distDir);
          this.log(`  ${formatSuccess('Uploaded to dev track')}`);
        } catch (err) {
          this.log(`  ${formatError(`upload failed - ${(err as Error).message}`)}`);
        }
      },
    });

    const shutdown = async () => {
      this.log('\nStopping watcher (waiting for any in-flight build/upload to finish)...');
      await watcher.stop();
      process.exit(0);
    };

    process.once('SIGINT', () => {
      void shutdown();
    });
    process.once('SIGTERM', () => {
      void shutdown();
    });

    // Keep process alive
    await new Promise(() => {});
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
