import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { build } from '../../src/lib/library/builder';
import { withTempCwd } from '../helpers/fixtures';

const GLOBAL_DTS = `declare module 'react' {
  const React: any;
  export default React;
}
declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare module '@tooljet/custom-component-sdk' {
  export const ToolJet: any;
}
declare module '*.css';
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'esnext',
    lib: ['dom', 'esnext'],
    module: 'esnext',
    moduleResolution: 'node',
    jsx: 'react-jsx',
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
    types: [],
  },
  include: ['src/**/*'],
});

function writeProject(dir: string, files: Record<string, string>): void {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);

  for (const [relPath, contents] of Object.entries(files)) {
    const fullPath = path.join(dir, 'src', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contents);
  }
}

describe('build - CSS bundling', () => {
  const cwd = withTempCwd();

  it('emits dist/index.css and reports hasCss when a component imports a stylesheet', async () => {
    // Padded past 1KB so cssSizeKb (rounded to whole KB) comes out non-zero and
    // is therefore distinguishable from the no-stylesheet case below.
    const rules = Array.from({ length: 60 }, (_, i) => `.tj-rule-${i} { margin-inline-start: ${i}px; }`).join('\n');

    writeProject(cwd.get(), {
      'index.ts': `export { Widget } from './Widget';\n`,
      'styles.css': `.tj-widget { color: rebeccapurple; padding: 12px; }\n${rules}\n`,
      'Widget.tsx': `import './styles.css';

export const Widget = () => <div className="tj-widget">Widget</div>;
`,
    });

    const result = await build(cwd.get(), { env: 'production' });

    expect(result.hasCss).to.be.true;
    const cssPath = path.join(cwd.get(), 'dist', 'index.css');
    expect(fs.existsSync(cssPath)).to.be.true;
    // Only the selector is asserted: a production build also minifies the CSS,
    // which rewrites values (`rebeccapurple` → `#639`).
    expect(fs.readFileSync(cssPath, 'utf8')).to.include('.tj-widget');
    expect(result.cssSizeKb).to.be.greaterThan(0);
    expect(result.componentCount).to.equal(1);
  }).timeout(30000);

  it('reports hasCss false and cssSizeKb 0 when nothing imports a stylesheet', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Widget } from './Widget';\n`,
      'Widget.tsx': `export const Widget = () => <div>Widget</div>;\n`,
    });

    const result = await build(cwd.get(), { env: 'production' });

    expect(result.hasCss).to.be.false;
    expect(result.cssSizeKb).to.equal(0);
    expect(fs.existsSync(path.join(cwd.get(), 'dist', 'index.css'))).to.be.false;
  }).timeout(30000);
});

describe('build - env-specific options', () => {
  const cwd = withTempCwd();

  // A `debugger` statement plus a deliberately verbose identifier: the first is
  // dropped only in production (`drop: ['debugger']`), the second survives
  // verbatim only when the bundle isn't minified.
  const DEBUGGER_PROJECT = {
    'index.ts': `export { Widget } from './Widget';\n`,
    'Widget.tsx': `export const Widget = () => {
  const aVeryDistinctiveLocalName = 'value';
  debugger;

  return <div>{aVeryDistinctiveLocalName}</div>;
};
`,
  };

  it('keeps the bundle unminified and preserves `debugger` in a development build', async () => {
    writeProject(cwd.get(), DEBUGGER_PROJECT);

    // 'development' is build()'s default, so this also covers the DevWatcher path,
    // which calls build(projectRoot) with no options at all.
    const result = await build(cwd.get());
    const bundle = fs.readFileSync(path.join(cwd.get(), 'dist', 'index.js'), 'utf8');

    expect(bundle).to.include('debugger');
    expect(bundle).to.include('aVeryDistinctiveLocalName');
    expect(result.componentCount).to.equal(1);
  }).timeout(30000);

  it('minifies and strips `debugger` in a production build', async () => {
    writeProject(cwd.get(), DEBUGGER_PROJECT);

    await build(cwd.get(), { env: 'production' });
    const bundle = fs.readFileSync(path.join(cwd.get(), 'dist', 'index.js'), 'utf8');

    expect(bundle).to.not.include('debugger');
    expect(bundle).to.not.include('aVeryDistinctiveLocalName');
  }).timeout(30000);

  it('pretty-prints manifest.json in development and minifies it in production', async () => {
    writeProject(cwd.get(), DEBUGGER_PROJECT);
    const manifestPath = path.join(cwd.get(), 'dist', 'manifest.json');

    await build(cwd.get());
    expect(fs.readFileSync(manifestPath, 'utf8')).to.include('\n');

    await build(cwd.get(), { env: 'production' });
    expect(fs.readFileSync(manifestPath, 'utf8')).to.not.include('\n');
  }).timeout(30000);

  it('clears a stale dist/ before rebuilding', async () => {
    writeProject(cwd.get(), DEBUGGER_PROJECT);
    const distDir = path.join(cwd.get(), 'dist');

    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'stale.js'), 'leftover from a previous build');

    await build(cwd.get());

    expect(fs.existsSync(path.join(distDir, 'stale.js'))).to.be.false;
    expect(fs.existsSync(path.join(distDir, 'index.js'))).to.be.true;
  }).timeout(30000);
});
