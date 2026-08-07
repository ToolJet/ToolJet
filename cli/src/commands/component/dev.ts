import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/component/auth';
import { ApiClient } from '../../lib/component/api-client';
import { ProjectConfig, ProjectConfigData } from '../../lib/component/project-config';
import { DevWatcher } from '../../lib/component/dev-watcher';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class Dev extends Command {
  static description = 'Watch src/ and upload to the dev track on every save';

  static examples = ['$ tooljet component dev', '$ tooljet component dev --debounce 500'];

  static flags = {
    debounce: Flags.integer({ description: 'Debounce ms between saves', default: 300 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Dev);

    const { workspaceId, apiToken } = Auth.resolveOrExit();
    const config = this.readConfigOrExit();
    const client = new ApiClient(apiToken);

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

    process.once('SIGINT', () => { void shutdown(); });
    process.once('SIGTERM', () => { void shutdown(); });

    // Keep process alive
    await new Promise(() => { });
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
