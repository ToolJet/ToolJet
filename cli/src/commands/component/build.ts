import { Command } from '@oclif/core';

import { build } from '../../lib/component/builder';

export default class Build extends Command {
  static description = 'Build the component library locally to dist/ (no upload, no auth required)';

  static examples = [`$ tooljet component build`];

  async run(): Promise<void> {
    const result = await build(process.cwd());

    // TODO: result.tsErrors is unreliable — esbuild only strips types, it never
    // type-checks, and esbuild.build() throws before returning whenever there
    // are real build errors. So result.errors (and thus tsErrors) is always 0
    // on this success path, even when the component code has genuine type
    // errors. Needs a real type-check pass (e.g. ts.getPreEmitDiagnostics on
    // the ts.Program already built in manifest-generator.ts) before this line
    // can be trusted. Commented out until that's fixed.
    // this.log(`✓ TypeScript compiled (${result.tsErrors} errors)`);
    this.log(`✓ Manifest generated: dist/manifest.json (${result.componentCount} components)`);
    this.log(`✓ Bundle built: dist/index.js (${result.bundleSizeKb} KB)`);

    if (result.hasCss) this.log(`✓ CSS output: dist/index.css (${result.cssSizeKb} KB)`);
  }
}
