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
declare module 'compiled-esm';
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

// The project opts in to recording a render (recordRender), as the shipped packs do, unless `record` is false.
function writeProject(
  dir: string,
  files: Record<string, string>,
  { react = true, record = true }: { react?: boolean; record?: boolean } = {}
): void {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.tooljet'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.tooljet', 'config.json'),
    JSON.stringify({ libraryName: 'Library', correlationId: 'c-1', ...(record ? { recordRender: true } : {}) })
  );
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

  it('reads display text built at runtime from the render, and drops its warning', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const COLORS = ['red', 'blue'];
export function Field() {
  ToolJet.useStateString({ name: 'color', label: 'Color', description: \`\${COLORS.join(', ')} or a CSS colour\` });
  return <div />;
}
`,
    });

    const result = await build(cwd.get());

    const color = readManifest(cwd.get()).components.Field.props[0];
    expect(color.description).to.equal('red, blue or a CSS colour');
    expect(result.warnings.join('\n')).to.not.include('description');
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

  it("loads a compiled package's default export the bundlers' way in an ES module project", async () => {
    // A "type": "module" project importing a CommonJS build of an ES module (exports.default, __esModule), as MUI's
    // @emotion/cache is: Node's interop would hand over the whole module.exports, and calling it threw.
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}import makeName from 'compiled-esm';
const useLook = () => ToolJet.useStyleString({ name: makeName(), initialValue: 'red' });
export function Field() {
  useLook();
  return <div />;
}
`,
    });
    fs.writeFileSync(path.join(cwd.get(), 'package.json'), '{ "name": "library", "type": "module" }');
    fs.mkdirSync(path.join(cwd.get(), 'node_modules', 'compiled-esm'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd.get(), 'node_modules', 'compiled-esm', 'package.json'),
      '{ "name": "compiled-esm", "main": "index.js" }'
    );
    fs.writeFileSync(
      path.join(cwd.get(), 'node_modules', 'compiled-esm', 'index.js'),
      'Object.defineProperty(exports, "__esModule", { value: true });\nexports.default = () => "tint";'
    );

    const result = await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field.styles.map((s: { name: string }) => s.name)).to.deep.equal([
      'tint',
    ]);
    expect(result.warnings.join('\n')).to.not.include('threw');
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

describe('build - recording a render is opt-in', () => {
  const cwd = withTempCwd();

  const helperProject = {
    'index.ts': `export { Field } from './Field';\n`,
    'styles.ts': FIELD_STYLES,
    'Field.tsx': `${SDK_IMPORT}import { useFieldStyles } from './styles';
export function Field() {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: 'Name' });
  useFieldStyles();
  return <div>{label}</div>;
}
`,
  };

  it("without recordRender, runs none of the project's code and names the helpers it can't read", async () => {
    // Break this catches: a customer's components run during their build without them asking for it, or fields in
    // helpers going missing with no word about why.
    writeProject(cwd.get(), helperProject, { record: false });
    fs.writeFileSync(
      path.join(cwd.get(), 'node_modules', 'react-dom', 'server.js'),
      'exports.renderToStaticMarkup = () => { throw new Error("rendered without recordRender"); };'
    );

    const result = await build(cwd.get());

    const field = readManifest(cwd.get()).components.Field;
    expect(field.props.map((p: { name: string }) => p.name)).to.deep.equal(['label']);
    expect(field.styles).to.deep.equal([]);
    expect(result.warnings).to.include(
      'Component "Field" declares fields through useFieldStyles: they won\'t show in the Inspector. ' +
        'Call the ToolJet hooks in the component itself, or set "recordRender": true in .tooljet/config.json.'
    );
  }).timeout(30000);

  it("with recordRender, records the helpers' fields and does not warn about them", async () => {
    writeProject(cwd.get(), helperProject);

    const result = await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field.styles).to.have.length(3);
    expect(result.warnings.join('\n')).to.not.include('declares fields through');
  }).timeout(30000);

  it('does not warn about helpers that use no ToolJet hooks', async () => {
    writeProject(
      cwd.get(),
      {
        'index.ts': `export { Field } from './Field';\n`,
        'Field.tsx': `${SDK_IMPORT}
const format = (s: string) => s.trim();
export function Field() {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: 'Name' });
  return <div>{format(label)}</div>;
}
`,
      },
      { record: false }
    );

    const result = await build(cwd.get());

    expect(result.warnings.join('\n')).to.not.include('declares fields through');
  }).timeout(30000);

  it('names a helper that reaches the hooks through another helper', async () => {
    writeProject(
      cwd.get(),
      {
        'index.ts': `export { Field } from './Field';\n`,
        'Field.tsx': `${SDK_IMPORT}
const useTint = () => ToolJet.useStyleString({ name: 'tint', initialValue: 'red' });
const useLook = () => useTint();
export function Field() {
  useLook();
  return <div />;
}
`,
      },
      { record: false }
    );

    const result = await build(cwd.get());

    expect(result.warnings.join('\n')).to.include('Component "Field" declares fields through useLook');
  }).timeout(30000);

  it('fails the build on a recordRender that is not true or false', async () => {
    writeProject(cwd.get(), helperProject);
    fs.writeFileSync(
      path.join(cwd.get(), '.tooljet', 'config.json'),
      JSON.stringify({ libraryName: 'Library', correlationId: 'c-1', recordRender: 'yes' })
    );

    let error: Error | undefined;
    try {
      await build(cwd.get());
    } catch (err) {
      error = err as Error;
    }
    expect(error?.message).to.include('"recordRender" must be true or false');
  }).timeout(30000);
});

describe('build - role mappings and library settings', () => {
  const cwd = withTempCwd();

  const settingsComponent = (settings: string) => ({
    'index.ts': `export { Field } from './Field';\n`,
    'Field.tsx': `${SDK_IMPORT}
export function Field() {
  ToolJet.useComponentSettings(${settings});
  return <div />;
}
`,
  });

  it('carries the role mappings the AI builder maps native widgets through', async () => {
    writeProject(
      cwd.get(),
      settingsComponent(`{
    role: 'button',
    roleProps: { text: 'children' },
    roleValues: { variant: { outline: 'outlined' }, hour12: { '12h': true, size: 2 }, tone: { ghost: { variant: 'text', color: 'inherit' } } },
    roleEvents: { onClick: 'onPress' },
    roleActions: { setText: 'setLabel' },
    labelCase: 'upper',
  }`)
    );

    await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field).to.include.keys(
      'roleProps',
      'roleValues',
      'roleEvents',
      'roleActions',
      'labelCase'
    );
    expect(readManifest(cwd.get()).components.Field).to.deep.include({
      roleProps: { text: 'children' },
      roleValues: {
        variant: { outline: 'outlined' },
        hour12: { '12h': true, size: 2 },
        tone: { ghost: { variant: 'text', color: 'inherit' } },
      },
      roleEvents: { onClick: 'onPress' },
      roleActions: { setText: 'setLabel' },
      labelCase: 'upper',
    });
  }).timeout(30000);

  it('records role mappings a helper passes to useComponentSettings', async () => {
    writeProject(cwd.get(), {
      'index.ts': `export { Field } from './Field';\n`,
      'Field.tsx': `${SDK_IMPORT}
const useRole = (prop: string) => ToolJet.useComponentSettings({ role: 'input', roleProps: { description: prop } });
export function Field() {
  useRole('extra');
  return <div />;
}
`,
    });

    await build(cwd.get());

    expect(readManifest(cwd.get()).components.Field.roleProps).to.deep.equal({ description: 'extra' });
  }).timeout(30000);

  it('fails the build on a role mapping that does not map names to names', async () => {
    writeProject(cwd.get(), settingsComponent(`{ roleProps: { text: 3 } }`));

    let error: Error | undefined;
    try {
      await build(cwd.get());
    } catch (err) {
      error = err as Error;
    }
    expect(error?.message).to.include('Invalid "roleProps" in component "Field"');
  }).timeout(30000);

  it("copies the library's theme mode and surface from .tooljet/config.json into the manifest", async () => {
    writeProject(cwd.get(), settingsComponent(`{ role: 'input' }`));
    fs.mkdirSync(path.join(cwd.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd.get(), '.tooljet', 'config.json'),
      JSON.stringify({
        libraryName: 'Ant',
        correlationId: 'c-1',
        recordRender: true,
        themeMode: 'own',
        surface: { page: '#f5f5f5' },
      })
    );

    await build(cwd.get());

    expect(readManifest(cwd.get())).to.deep.include({ themeMode: 'own', surface: { page: '#f5f5f5' } });
  }).timeout(30000);

  it('fails the build on an unknown theme mode', async () => {
    writeProject(cwd.get(), settingsComponent(`{ role: 'input' }`));
    fs.mkdirSync(path.join(cwd.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd.get(), '.tooljet', 'config.json'),
      JSON.stringify({ libraryName: 'Ant', correlationId: 'c-1', themeMode: 'dark' })
    );

    let error: Error | undefined;
    try {
      await build(cwd.get());
    } catch (err) {
      error = err as Error;
    }
    expect(error?.message).to.include(`"themeMode" must be 'own'`);
  }).timeout(30000);
});
