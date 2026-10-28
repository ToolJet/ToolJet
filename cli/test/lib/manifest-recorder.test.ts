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
declare module 'browser-only';
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

// Just enough of React for the recorder: elements are plain objects, and rendering calls each function component
// (and the ones it returns) with its props.
const FAKE_REACT = {
  'react/package.json': '{ "name": "react", "main": "index.js" }',
  'react/index.js': 'exports.createElement = (type, props) => ({ type, props: props || {} });',
  'react/jsx-runtime.js':
    'const el = (type, props) => ({ type, props: props || {} });\nexports.jsx = el;\nexports.jsxs = el;\nexports.Fragment = "fragment";',
  'react-dom/package.json': '{ "name": "react-dom", "main": "index.js" }',
  'react-dom/index.js': '',
  'react-dom/server.js': `
const render = (node) => {
  if (Array.isArray(node)) return node.forEach(render);
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'function') return render(node.type(node.props));
  render(node.props && node.props.children);
};
exports.renderToStaticMarkup = (element) => { render(element); return ''; };`,
};

function writeProject(dir: string, files: Record<string, string>, { react = true } = {}): void {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), '{ "name": "library" }');
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);
  const modules = react ? FAKE_REACT : {};
  for (const [relPath, contents] of Object.entries(modules)) {
    const fullPath = path.join(dir, 'node_modules', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contents);
  }
  for (const [relPath, contents] of Object.entries(files)) {
    const fullPath = path.join(dir, 'src', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contents);
  }
}

const readManifest = (dir: string) => JSON.parse(fs.readFileSync(path.join(dir, 'dist', 'manifest.json'), 'utf8'));

const SDK_IMPORT = `import { ToolJet } from '@tooljet/custom-component-sdk';\n`;

// A helper hook in its own file, as a pack shares one set of field styles across its inputs.
const FIELD_STYLES = `${SDK_IMPORT}
const LOOKS = [
  ['labelColor', 'Label color', '#111111'],
  ['borderColor', 'Border color', '#dddddd'],
] as const;
export const useFieldStyles = () => {
  const vars: Record<string, string> = {};
  for (const [name, label, initialValue] of LOOKS) {
    vars[name] = ToolJet.useStyleString({ name, label, inspector: 'color', initialValue });
  }
  vars.radius = String(ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Radius', initialValue: 6 }));
  return vars;
};
export const useBusy = () => ToolJet.useControlState();
export const useCheck = (value: string) => ToolJet.useValidation({ kind: 'choice', value });
`;

describe('build - fields declared through helper functions', () => {
  const cwd = withTempCwd();

  it('records styles a helper hook declares in a loop, in call order, with their options', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'styles.ts': FIELD_STYLES,
      'Field.tsx': `${SDK_IMPORT}import { useFieldStyles } from './styles';
export function Field() {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: 'Name' });
  useFieldStyles();
  return <div>{label}</div>;
}
`,
    });

    await build(cwd.get());

    const field = readManifest(cwd.get()).components.Field;
    expect(field.props.map((p: { name: string }) => p.name)).to.deep.equal(['label']);
    expect(field.styles).to.deep.equal([
      { name: 'labelColor', type: 'string', default: '#111111', label: 'Label color', inspector: 'color' },
      { name: 'borderColor', type: 'string', default: '#dddddd', label: 'Border color', inspector: 'color' },
      { name: 'borderRadius', type: 'number', default: 6, label: 'Radius' },
    ]);
  }).timeout(30000);

  it('records the control state and validation kind a helper asks for', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'styles.ts': FIELD_STYLES,
      'Field.tsx': `${SDK_IMPORT}import { useBusy, useCheck } from './styles';
export function Field() {
  useBusy();
  useCheck('');
  return <div />;
}
`,
    });

    await build(cwd.get());

    const field = readManifest(cwd.get()).components.Field;
    expect(field.controlState).to.equal(true);
    expect(field.validation).to.equal('choice');
  }).timeout(30000);

  it('records events, actions and settings a helper declares', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const useCommon = (role: string) => {
  ToolJet.useEventCallback({ name: 'onChange', displayName: 'On change' });
  ToolJet.useAction({ name: 'clear', displayName: 'Clear', params: [{ handle: 'keep', type: 'toggle', defaultValue: false }] }, () => {});
  ToolJet.useComponentSettings({ role, fit: true, loading: 'own', defaultWidth: 8, defaultHeight: 3 });
};
export function Field() {
  useCommon('input');
  return <div />;
}
`,
    });

    await build(cwd.get());

    const field = readManifest(cwd.get()).components.Field;
    expect(field.events).to.deep.equal([{ name: 'onChange', displayName: 'On change' }]);
    expect(field.actions).to.deep.equal([
      { name: 'clear', displayName: 'Clear', params: [{ handle: 'keep', defaultValue: false, type: 'toggle' }] },
    ]);
    expect(field).to.include({ role: 'input', fit: true, loading: 'own', defaultWidth: 8, defaultHeight: 3 });
  }).timeout(30000);

  it('records a drop area drawn by a helper component', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Panel } from './Panel';\n`,
      'Panel.tsx': `${SDK_IMPORT}
const Body = ({ slot }: { slot: string }) => <ToolJet.PopupSlot name={slot} />;
export function Panel() {
  return <div><Body slot={'dialog' + 'Body'} /></div>;
}
`,
    });

    await build(cwd.get());

    expect(readManifest(cwd.get()).components.Panel.slots).to.deep.equal([{ name: 'dialogBody', kind: 'popup' }]);
  }).timeout(30000);

  it('keeps a field behind a condition that the render did not reach, after the recorded ones', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const useExtra = () => ToolJet.useStyleString({ name: 'accent', initialValue: 'blue' });
export function Field({ advanced }: { advanced?: boolean }) {
  useExtra();
  if (advanced) ToolJet.useStyleString({ name: 'shadow', initialValue: 'none' });
  return <div />;
}
`,
    });

    await build(cwd.get());

    const styles = readManifest(cwd.get()).components.Field.styles.map((s: { name: string }) => s.name);
    expect(styles).to.deep.equal(['accent', 'shadow']);
  }).timeout(30000);

  it('fills in a default the static pass could not read, and drops its warning', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
export function Field() {
  const [seed] = ToolJet.useStateString({ name: 'defaultValue', initialValue: 'hello' });
  const [value] = ToolJet.useStateString({ name: 'value', initialValue: seed });
  return <div>{value}</div>;
}
`,
    });

    const result = await build(cwd.get());

    const value = readManifest(cwd.get()).components.Field.props.find((p: { name: string }) => p.name === 'value');
    expect(value.default).to.equal('hello');
    expect(result.warnings.join('\n')).to.not.include('initialValue');
  }).timeout(30000);

  it('stands in for a package that fails to load outside a browser', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { MapView } from './MapView';\n`,
      'MapView.tsx': `${SDK_IMPORT}import L from 'browser-only';
const useMapStyles = () => ToolJet.useStyleString({ name: 'markerColor', initialValue: 'red' });
export function MapView() {
  useMapStyles();
  return <div>{String(L.version)}</div>;
}
`,
    });
    fs.mkdirSync(path.join(cwd.get(), 'node_modules', 'browser-only'), { recursive: true });
    fs.writeFileSync(path.join(cwd.get(), 'node_modules', 'browser-only', 'index.js'), 'window.L = {};');

    await build(cwd.get());

    const styles = readManifest(cwd.get()).components.MapView.styles.map((s: { name: string }) => s.name);
    expect(styles).to.deep.equal(['markerColor']);
  }).timeout(30000);

  it('keeps what was recorded before a component throws, and warns', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const useLook = () => ToolJet.useStyleString({ name: 'tint', initialValue: 'red' });
export function Field() {
  useLook();
  if (typeof window === 'undefined') throw new Error('needs a browser');
  return <div />;
}
`,
    });

    const result = await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field.styles.map((s: { name: string }) => s.name)).to.deep.equal([
      'tint',
    ]);
    expect(result.warnings.join('\n')).to.include('Component "Field" threw while rendering');
  }).timeout(30000);

  it('fails the build on a reserved name declared through a helper', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const useOwnValidity = () => ToolJet.useStateBoolean({ name: 'isValid', initialValue: true });
export function Field() {
  ToolJet.useValidation({ value: '' });
  useOwnValidity();
  return <div />;
}
`,
    });

    let error: Error | undefined;
    try {
      await build(cwd.get());
    } catch (err) {
      error = err as Error;
    }
    expect(error?.message).to.include('Name "isValid" in component "Field" is reserved by ToolJet');
  }).timeout(30000);

  it('keeps the static manifest and warns when react is not installed', async () => {
    writeProject(
      cwd.get(),
      {
        'index.ts': `export { Field } from './Field';\n`,
        'styles.ts': FIELD_STYLES,
        'Field.tsx': `${SDK_IMPORT}import { useFieldStyles } from './styles';
export function Field() {
  useFieldStyles();
  return <div />;
}
`,
      },
      { react: false }
    );

    const result = await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field.styles).to.deep.equal([]);
    expect(result.warnings.join('\n')).to.include("react and react-dom aren't installed");
  }).timeout(30000);
});
