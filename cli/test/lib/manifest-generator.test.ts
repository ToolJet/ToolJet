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
