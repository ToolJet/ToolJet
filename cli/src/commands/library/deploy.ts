import { Command, Flags } from '@oclif/core';

import { Auth } from '../../lib/library/auth';
import { build } from '../../lib/library/builder';
import { ApiClient } from '../../lib/library/api-client';
import { ProjectConfig, ProjectConfigEntry } from '../../lib/library/project-config';
import { writeLibraryConfig } from '../../lib/library/scaffolder';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class ComponentDeploy extends Command {
  static description = 'Build and publish a new immutable production revision of a component library';

  static aliases = ['lib:deploy'];

  static examples = [
    `$ tooljet library deploy`,
    `$ tooljet library deploy --message "Add dark mode support"`,
    `$ tooljet library deploy --origin-url https://app.tooljet.ai --api-token <token>`,
    `$ tooljet lib deploy`,
    `$ tooljet lib deploy --message "Add dark mode support"`,
  ];

  static flags = {
    message: Flags.string({ description: 'Optional label for the revision (shown in app builder revision picker)' }),
    force: Flags.boolean({
      description: 'Publish even if the build reports TypeScript errors',
      default: false,
    }),
    'origin-url': Flags.string({
      description: 'ToolJet origin URL to deploy to, bypassing the stored login (must be used with --api-token)',
    }),
    'api-token': Flags.string({
      description: 'API token to deploy with, bypassing the stored login (must be used with --origin-url)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ComponentDeploy);
    const { message, force } = flags;

    const { workspaceId, apiToken, url, config, usedFlags } = await this.resolveTarget(flags);

    const currentDir = process.cwd();
    const client = new ApiClient(url, apiToken);

    try {
      // findOrCreateLibrary (flags path) already confirmed the library exists.
      if (!usedFlags) await client.verifyLibrary(config.libraryId);

      this.log(`Building your component library...\n`);

      const result = await build(currentDir, { env: 'production' });

      this.log(formatSuccess(`Manifest generated: dist/manifest.json (${result.componentCount} components)`));
      this.log(formatSuccess(`Bundle built: dist/index.js (${result.bundleSizeKb} KB)`));

      if (result.hasCss) this.log(formatSuccess(`CSS output: dist/index.css (${result.cssSizeKb} KB)`));

      if (result.componentCount === 0) {
        this.log(formatError(`Aborting - no components found in manifest. Publish requires at least one component.`));
        process.exit(1);
      }

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

  // Resolves { workspaceId, apiToken, url, config } either from --origin-url/--api-token
  // (find-or-create against that workspace directly) or from the stored login + project's
  // workspaces map (existing behavior). Exits with a clear error on any failure.
  private async resolveTarget(flags: {
    'origin-url'?: string;
    'api-token'?: string;
  }): Promise<{ workspaceId: string; apiToken: string; url: string; config: ProjectConfigEntry; usedFlags: boolean }> {
    const originUrl = flags['origin-url'];
    const apiToken = flags['api-token'];

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
      this.log(formatError('--origin-url and --api-token must be provided together'));
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
