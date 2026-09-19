import { Command } from '@oclif/core';

import { build } from '../../lib/library/builder';
import { formatError, formatSuccess, formatDuration } from '../../lib/log';

export default class Build extends Command {
  static description = 'Build the component library locally to dist/ (no upload, no auth required)';

  static aliases = ['lib:build'];

  static examples = [`$ tooljet library build`, `$ tooljet lib build`];

  async run(): Promise<void> {
    try {
      this.log(`Building your component library...\n`);

      const result = await build(process.cwd(), { env: 'production' });

      const tsCompiledMsg = `TypeScript compiled (${result.tsErrors} errors)`;
      const buildTime = formatDuration(result.buildMs);

      this.log(result.tsErrors > 0 ? formatError(tsCompiledMsg) : formatSuccess(tsCompiledMsg));
      if (result.tsErrors > 0) this.log(`\n${result.tsErrorReport}`);
      this.log(formatSuccess(`Manifest generated: dist/manifest.json (${result.componentCount} components)`));
      this.log(formatSuccess(`Bundle built: dist/index.js (${result.bundleSizeKb} KB)`));

      if (result.hasCss) this.log(formatSuccess(`CSS output: dist/index.css (${result.cssSizeKb} KB)`));

      this.log(`\n Build completed in ${buildTime}`);

      if (result.tsErrors > 0) process.exitCode = 1;
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
