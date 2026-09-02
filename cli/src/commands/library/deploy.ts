import { Command, Flags } from '@oclif/core';
import * as inquirer from 'inquirer';

import { Auth } from '../../lib/library/auth';
import { build } from '../../lib/library/builder';
import { ApiClient } from '../../lib/library/api-client';
import { ProjectConfig } from '../../lib/library/project-config';
import { validateOriginUrl, validateApiToken } from '../../lib/library/target-validation';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

interface ResolvedTarget {
  workspaceId: string;
  apiToken: string;
  url: string;
  config: { libraryName: string; correlationId: string };
}

export default class ComponentDeploy extends Command {
  static description = 'Build and publish a new immutable production revision of a component library';

  static aliases = ['lib:deploy'];

  static examples = [
    `$ tooljet library deploy --version 1.0.0`,
    `$ tooljet library deploy -v 1.0.0`,
    `$ tooljet library deploy --version 1.0.0 --message "Add dark mode support"`,
    `$ tooljet library deploy --version 1.0.0 --url https://app.tooljet.ai --token <token>`,
    `$ tooljet lib deploy --version 1.0.0`,
    `$ tooljet lib deploy --version 1.0.0 --message "Add dark mode support"`,
  ];

  static flags = {
    version: Flags.string({
      char: 'v',
      description: 'Version for this revision — X, X.Y, or X.Y.Z (e.g. 1, 1.1, or 1.2.0); missing parts default to 0',
      required: true,
    }),
    message: Flags.string({ description: 'Optional label for the revision (shown in app builder revision picker)' }),
    force: Flags.boolean({
      description: 'Publish even if the build reports TypeScript errors',
      default: false,
    }),
    url: Flags.string({
      description: 'ToolJet origin URL to deploy to, bypassing the stored login (must be used with --token)',
    }),
    token: Flags.string({
      description: 'API token to deploy with, bypassing the stored login (must be used with --url)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ComponentDeploy);
    const { version, message, force } = flags;

    if (!/^\d+(\.\d+){0,2}$/.test(version)) {
      this.log(formatError('--version must be in the format X, X.Y, or X.Y.Z (e.g. 1, 1.1, or 1.2.0)'));
      process.exit(1);
    }

    const { workspaceId, apiToken, url, config } = await this.resolveTarget(flags);

    const currentDir = process.cwd();
    const client = new ApiClient(url, apiToken);

    try {
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

      const revision = await client.publishRevision(config.correlationId, result.distDir, version, message);

      this.log(`\n${formatSuccess(`Published as ${revision.version} on ${workspaceId} workspace\n`)}`);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  // Resolves { workspaceId, apiToken, url, config } either from --url/--token (always
  // find-or-create against that workspace directly) or from the stored login + the project's
  // correlationId (verified live against the server; if missing in this workspace, the user is
  // prompted before it's created — no local "is this workspace registered" cache any more).
  // Exits with a clear error on any failure.
  private async resolveTarget(flags: { url?: string; token?: string }): Promise<ResolvedTarget> {
    const originUrl = flags.url;
    const apiToken = flags.token;

    if (!originUrl && !apiToken) {
      const { workspaceId, apiToken, url } = Auth.resolveOrExit();
      const { libraryName, correlationId } = ProjectConfig.readFileOrExit();
      const client = new ApiClient(url, apiToken);

      let verification: { exists: boolean };
      try {
        verification = await client.verifyLibrary(correlationId);
      } catch (err) {
        this.log(formatError((err as Error).message));
        process.exit(1);
      }

      if (!verification.exists) {
        const { confirmed } = await inquirer.prompt([
          {
            name: 'confirmed',
            type: 'confirm',
            message: `Library "${libraryName}" wasn't found in workspace "${workspaceId}" — create it there now?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          this.log(formatError('Aborted — library not created.'));
          process.exit(1);
        }

        try {
          await client.findOrCreateLibrary(correlationId, libraryName);
        } catch (err) {
          this.log(formatError((err as Error).message));
          process.exit(1);
        }
        this.log(formatSuccess(`Created library "${libraryName}" on ${workspaceId} workspace`));
      }

      return { workspaceId, apiToken, url, config: { libraryName, correlationId } };
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

    const { libraryName, correlationId } = ProjectConfig.readFileOrExit();
    const client = new ApiClient(originUrl, apiToken);

    let resolved;
    try {
      resolved = await client.findOrCreateLibrary(correlationId, libraryName);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }

    this.log(
      formatSuccess(
        resolved.created
          ? `Created library on ${resolved.organizationId} workspace`
          : `Found existing library on ${resolved.organizationId} workspace`
      )
    );

    return {
      workspaceId: resolved.organizationId,
      apiToken,
      url: originUrl,
      config: { libraryName: resolved.name, correlationId: resolved.correlationId },
    };
  }
}
