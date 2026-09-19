import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { generateManifest } from '../../src/lib/library/manifest-generator';
import { withTempCwd } from '../helpers/fixtures';

const GLOBAL_DTS = `declare module 'react' {
  const React: any;
  export default React;
  export const Fragment: any;
}
declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare module '@tooljet/custom-component-sdk' {
  export const ToolJet: any;
}
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

const TSCONFIG = JSON.stringify(
  {
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
  },
  null,
  2
);

function writeProject(dir: string, componentSrc: string): void {
  fs.mkdirSync(path.join(dir, 'src', 'components', 'Widget'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), `export { Widget } from './components/Widget';\n`);
  fs.writeFileSync(path.join(dir, 'src', 'components', 'Widget', 'index.tsx'), componentSrc);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);
}

describe('generateManifest - prop section', () => {
  const cwd = withTempCwd();

  it('passes a useStateX "section" option through to the prop manifest', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

export const Widget = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: 'Hi', section: 'Content' });

  return <div>{label}</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props).to.deep.equal([
      { name: 'label', type: 'string', default: 'Hi', section: 'Content' },
    ]);
  }).timeout(30000);

  it('omits "section" when a prop does not declare one', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

export const Widget = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: 'Hi' });

  return <div>{label}</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props[0]).to.not.have.property('section');
  }).timeout(30000);
});

const HELLO_WORLD_TEMPLATE_PATH = path.join(__dirname, '../../src/_templates/library/new/hello-world.ejs.t');

// Hygen templates start with a `---\n...\n---\n` frontmatter block naming the output
// path — strip it to get the real TSX source the CLI compiles.
function stripHygenFrontmatter(templateSrc: string): string {
  return templateSrc.replace(/^---\n[\s\S]*?\n---\n/, '');
}

describe('generateManifest - shipped HelloWorld template', () => {
  const cwd = withTempCwd();

  it('produces a valid manifest with whole-number defaultWidth/defaultHeight', async () => {
    const componentSrc = stripHygenFrontmatter(fs.readFileSync(HELLO_WORLD_TEMPLATE_PATH, 'utf8'));

    fs.mkdirSync(path.join(cwd.get(), 'src', 'components', 'HelloWorld'), { recursive: true });
    fs.writeFileSync(path.join(cwd.get(), 'src', 'global.d.ts'), GLOBAL_DTS);
    fs.writeFileSync(
      path.join(cwd.get(), 'src', 'index.ts'),
      `export { HelloWorld } from './components/HelloWorld';\n`
    );
    fs.writeFileSync(path.join(cwd.get(), 'src', 'components', 'HelloWorld', 'index.tsx'), componentSrc);
    fs.writeFileSync(path.join(cwd.get(), 'tsconfig.json'), TSCONFIG);

    // tsErrorCount isn't asserted here: this test's ambient `react` stub (GLOBAL_DTS)
    // is intentionally minimal and doesn't declare the `React` namespace `React.FC`
    // needs — a real scaffolded project gets that from an installed @types/react.
    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.HelloWorld.defaultWidth).to.equal(8);
    expect(manifest.components.HelloWorld.defaultHeight).to.equal(6);
  }).timeout(30000);
});

describe('generateManifest - defaultWidth/defaultHeight', () => {
  const cwd = withTempCwd();

  it('accepts whole-number defaultWidth/defaultHeight', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

      export const Widget = () => {
        ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 6 });

        return <div>Widget</div>;
      };
      `
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.defaultWidth).to.equal(8);
    expect(manifest.components.Widget.defaultHeight).to.equal(6);
  }).timeout(30000);

  it('rejects a non-whole-number defaultWidth', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

      export const Widget = () => {
        ToolJet.useComponentSettings({ defaultWidth: 8.5 });

        return <div>Widget</div>;
      };
      `
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/defaultWidth.*whole number/i);
  }).timeout(30000);

  it('rejects a non-whole-number defaultHeight', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

      export const Widget = () => {
        ToolJet.useComponentSettings({ defaultHeight: 4.2 });

        return <div>Widget</div>;
      };
      `
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/defaultHeight.*whole number/i);
  }).timeout(30000);

  it('rejects zero or negative defaultWidth/defaultHeight', async () => {
    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

      export const Widget = () => {
        ToolJet.useComponentSettings({ defaultWidth: 0 });

        return <div>Widget</div>;
      };
      `
    );
    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/defaultWidth.*positive whole number/i);

    writeProject(
      cwd.get(),
      `import { ToolJet } from '@tooljet/custom-component-sdk';

      export const Widget = () => {
        ToolJet.useComponentSettings({ defaultHeight: -3 });

        return <div>Widget</div>;
      };
      `
    );
    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/defaultHeight.*positive whole number/i);
  }).timeout(30000);
});
