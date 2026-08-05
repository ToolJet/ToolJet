import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/component/auth';
import { ApiClient } from '../../lib/component/api-client';
import { ProjectConfig, ProjectConfigData } from '../../lib/component/project-config';
import { DevWatcher } from '../../lib/component/dev-watcher';

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
      this.log('\x1b[41m%s\x1b[0m', `Error : Could not reach library on ${workspaceId}: ${(err as Error).message}`);
      process.exit(1);
    }

    this.log(`✓ Connected to ${workspaceId} workspace`);
    this.log(`✓ Library: ${config.libraryName} (dev track)\n`);
    this.log('Watching src/ for changes...\n');

    DevWatcher.start({
      projectRoot: process.cwd(),
      debounceMs: flags.debounce,
      onRebuild: async (result) => {
        if ('error' in result) {
          this.log(`  → build failed: ${result.error.message} ✗`);
          return;
        }

        this.log(`  → built in ${result.buildMs}ms`);

        try {
          await client.uploadDev(config.libraryId, result.distDir);
          this.log(`  → uploaded to dev track ✓`);
        } catch (err) {
          this.log(`  → upload failed: ${(err as Error).message} ✗`);
        }
      },
    });

    // Keep process alive
    await new Promise(() => { });
  }

  private readConfigOrExit(): ProjectConfigData {
    try {
      return ProjectConfig.read();
    } catch (err) {
      this.log('\x1b[41m%s\x1b[0m', `Error : ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
