import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/library/auth';
import { ApiClient } from '../../lib/library/api-client';
import { ProjectConfig, ProjectConfigEntry } from '../../lib/library/project-config';
import { writeLibraryConfig } from '../../lib/library/scaffolder';
import { DevWatcher } from '../../lib/library/dev-watcher';
import { validateOriginUrl, validateApiToken } from '../../lib/library/target-validation';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class Dev extends Command {
  static description = 'Watch src/ and upload to the dev track on every save';

  static aliases = ['lib:dev'];

  static examples = [
    '$ tooljet library dev',
    '$ tooljet library dev --debounce 500',
    '$ tooljet library dev --url https://app.tooljet.ai --token <token>',
    '$ tooljet lib dev',
    '$ tooljet lib dev --debounce 500',
  ];

  static flags = {
    debounce: Flags.integer({ description: 'Debounce ms between saves', default: 300 }),
    url: Flags.string({
      description: 'ToolJet origin URL to connect to, bypassing the stored login (must be used with --token)',
    }),
    token: Flags.string({
      description: 'API token to connect with, bypassing the stored login (must be used with --url)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Dev);

    const { workspaceId, apiToken, url, config, usedFlags } = await this.resolveTarget(flags);
    const client = new ApiClient(url, apiToken);

    // findOrCreateLibrary (flags path) already confirmed the library exists.
    if (!usedFlags) {
      try {
        await client.verifyLibrary(config.libraryId);
      } catch (err) {
        this.log(formatError((err as Error).message));
        process.exit(1);
      }
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

  // Resolves { workspaceId, apiToken, url, config } either from --url/--token
  // (find-or-create against that workspace directly) or from the stored login + project's
  // workspaces map (existing behavior). Exits with a clear error on any failure.
  private async resolveTarget(flags: {
    url?: string;
    token?: string;
  }): Promise<{ workspaceId: string; apiToken: string; url: string; config: ProjectConfigEntry; usedFlags: boolean }> {
    const originUrl = flags.url;
    const apiToken = flags.token;

    if (!originUrl && !apiToken) {
      const { workspaceId, apiToken, url } = Auth.resolveOrExit();
      return {
        workspaceId,
        apiToken,
        url,
        config: ProjectConfig.resolveForWorkspaceOrExit(workspaceId),
        usedFlags: false,
      };
    }

    if (!originUrl || !apiToken) {
      this.log(formatError('--url and --token must be provided together'));
      process.exit(1);
    }

    const originUrlError = validateOriginUrl(originUrl);
    if (originUrlError !== true) {
      this.log(formatError(originUrlError));
      process.exit(1);
    }

    const apiTokenError = validateApiToken(apiToken);
    if (apiTokenError !== true) {
      this.log(formatError(apiTokenError));
      process.exit(1);
    }

    let libraryName: string, correlationId: string;
    try {
      ({ libraryName, correlationId } = ProjectConfig.readFile());
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    const client = new ApiClient(originUrl, apiToken);

    let resolved;
    try {
      resolved = await client.findOrCreateLibrary(correlationId, libraryName);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    const config = { libraryId: resolved.id, libraryName: resolved.name, correlationId: resolved.correlationId };
    writeLibraryConfig(process.cwd(), { workspaceId: resolved.organizationId, ...config });
    this.log(
      formatSuccess(
        resolved.created
          ? `Created library on ${resolved.organizationId} workspace`
          : `Found existing library on ${resolved.organizationId} workspace`
      )
    );

    return { workspaceId: resolved.organizationId, apiToken, url: originUrl, config, usedFlags: true };
  }
}
