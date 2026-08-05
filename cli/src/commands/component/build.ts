import { Command } from '@oclif/core';

import { build } from '../../lib/component/builder';

export default class Build extends Command {
  static description = 'Build the component library locally to dist/ (no upload, no auth required)';

  static examples = [`$ tooljet component build`];

  async run(): Promise<void> {
    try {
      const result = await build(process.cwd());

      this.log(`✓ TypeScript compiled (${result.tsErrors} errors)`);
      this.log(`✓ Manifest generated: dist/manifest.json (${result.componentCount} components)`);
      this.log(`✓ Bundle built: dist/index.js (${result.bundleSizeKb} KB)`);

      if (result.hasCss) this.log(`✓ CSS output: dist/index.css (${result.cssSizeKb} KB)`);
    } catch (err) {
      this.log('\x1b[41m%s\x1b[0m', `Error : ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
