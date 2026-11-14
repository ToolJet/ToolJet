import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { prebuiltResult } from '../../../src/lib/library/builder';

/*
  A ToolJet server that builds Code mode apps in a sandbox gets the dist folder back and uploads it with
  `tooljet app dev --once --prebuilt <dist>`, which reads it as a build result instead of building on the server.
*/
describe('a prebuilt bundle', () => {
  let dir: string;
  beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-prebuilt-'))));
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('reads as a clean build of its files and components', () => {
    fs.writeFileSync(path.join(dir, 'index.js'), 'x'.repeat(4096));
    fs.writeFileSync(path.join(dir, 'index.css'), 'y'.repeat(2048));
    fs.writeFileSync(
      path.join(dir, 'manifest.json'),
      JSON.stringify({ components: [{ name: 'App' }, { name: 'Other' }] })
    );
    const result = prebuiltResult(dir);
    expect(result).to.include({
      distDir: dir,
      bundleSizeKb: 4,
      cssSizeKb: 2,
      hasCss: true,
      tsErrors: 0,
      componentCount: 2,
    });
    expect(result.warnings).to.deep.equal([]);
  });

  it('has no css when the build made none', () => {
    fs.writeFileSync(path.join(dir, 'index.js'), 'x');
    fs.writeFileSync(path.join(dir, 'manifest.json'), '{}');
    expect(prebuiltResult(dir)).to.include({ hasCss: false, cssSizeKb: 0, componentCount: 0 });
  });

  it('is refused when the folder is not a build', () => {
    fs.writeFileSync(path.join(dir, 'index.js'), 'x');
    expect(() => prebuiltResult(dir)).to.throw('is not a built bundle');
  });
});
