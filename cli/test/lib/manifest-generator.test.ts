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

// Writes a project whose src/ contents are given verbatim, keyed by path relative
// to src/ — for shapes writeProject()'s single re-exported component can't express
// (multiple components, direct exports from index.ts, non-component exports).
function writeProjectFiles(dir: string, files: Record<string, string>): void {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'global.d.ts'), GLOBAL_DTS);
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG);

  for (const [relPath, contents] of Object.entries(files)) {
    const fullPath = path.join(dir, 'src', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contents);
  }
}

const SDK_IMPORT = `import { ToolJet } from '@tooljet/custom-component-sdk';\n`;

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

describe('generateManifest - prop extraction', () => {
  const cwd = withTempCwd();

  it('maps every useStateX hook to its manifest prop type, with literal initialValues', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({ name: 'title', initialValue: 'Hi' });
  ToolJet.useStateNumber({ name: 'count', initialValue: 42 });
  ToolJet.useStateNumber({ name: 'offset', initialValue: -7 });
  ToolJet.useStateBoolean({ name: 'visible', initialValue: false });
  ToolJet.useStateObject({ name: 'style', initialValue: { color: 'red', nested: { size: 2 } } });
  ToolJet.useStateArray({ name: 'items', initialValue: ['a', 'b'] });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props).to.deep.equal([
      { name: 'title', type: 'string', default: 'Hi' },
      { name: 'count', type: 'number', default: 42 },
      // Negative numbers are a PrefixUnaryExpression in the AST, not a NumericLiteral.
      { name: 'offset', type: 'number', default: -7 },
      { name: 'visible', type: 'boolean', default: false },
      { name: 'style', type: 'object', default: { color: 'red', nested: { size: 2 } } },
      { name: 'items', type: 'array', default: ['a', 'b'] },
    ]);
  }).timeout(30000);

  it('carries label, description and inspector through to the manifest', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({
    name: 'title',
    label: 'Title',
    description: 'Heading text',
    inspector: 'text',
    initialValue: 'Hi',
  });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props[0]).to.deep.equal({
      name: 'title',
      type: 'string',
      default: 'Hi',
      label: 'Title',
      description: 'Heading text',
      inspector: 'text',
    });
  }).timeout(30000);

  it('omits optional metadata keys entirely when they are not declared', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({ name: 'title' });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());
    const prop = manifest.components.Widget.props[0];

    expect(prop.name).to.equal('title');
    expect(prop.default).to.be.undefined;
    for (const key of ['label', 'description', 'inspector', 'enumValues', 'enumLabels', 'section']) {
      expect(prop).to.not.have.property(key);
    }
  }).timeout(30000);

  it('leaves default undefined when initialValue is not a statically evaluable literal', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
const computed = 'x'.repeat(3);

export const Widget = () => {
  ToolJet.useStateString({ name: 'title', initialValue: computed });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props[0].default).to.be.undefined;
  }).timeout(30000);

  it('throws on a duplicate prop name within the same component', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({ name: 'title', initialValue: 'a' });
  ToolJet.useStateNumber({ name: 'title', initialValue: 1 });

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/Duplicate prop name "title"/);
  }).timeout(30000);

  it('allows the same prop name in two different components', async () => {
    writeProjectFiles(cwd.get(), {
      'index.ts': `export { Alpha } from './Alpha';\nexport { Beta } from './Beta';\n`,
      'Alpha.tsx': `${SDK_IMPORT}
export const Alpha = () => {
  ToolJet.useStateString({ name: 'title', initialValue: 'a' });

  return <div>Alpha</div>;
};
`,
      'Beta.tsx': `${SDK_IMPORT}
export const Beta = () => {
  ToolJet.useStateString({ name: 'title', initialValue: 'b' });

  return <div>Beta</div>;
};
`,
    });

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Alpha.props[0].default).to.equal('a');
    expect(manifest.components.Beta.props[0].default).to.equal('b');
  }).timeout(30000);

  it('ignores a call on a local "ToolJet" that was not imported from the SDK', async () => {
    writeProject(
      cwd.get(),
      `const ToolJet = { useStateString: (_options: unknown) => ['', () => undefined] };

export const Widget = () => {
  ToolJet.useStateString({ name: 'shouldNotAppear', initialValue: 'x' });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props).to.deep.equal([]);
  }).timeout(30000);

  it('ignores hook calls nested inside a callback rather than the component body', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({ name: 'topLevel', initialValue: 'a' });

  const onClick = () => {
    ToolJet.useStateString({ name: 'nested', initialValue: 'b' });
  };

  return <div onClick={onClick}>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props.map((p) => p.name)).to.deep.equal(['topLevel']);
  }).timeout(30000);
});

describe('generateManifest - useStateEnumeration', () => {
  const cwd = withTempCwd();

  it('extracts enumValues and enumLabels', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateEnumeration({
    name: 'size',
    initialValue: 'sm',
    enumDefinition: ['sm', 'md', 'lg'],
    enumLabels: { sm: 'Small', md: 'Medium', lg: 'Large' },
  });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props[0]).to.deep.equal({
      name: 'size',
      type: 'enumeration',
      default: 'sm',
      enumValues: ['sm', 'md', 'lg'],
      enumLabels: { sm: 'Small', md: 'Medium', lg: 'Large' },
    });
  }).timeout(30000);

  it('throws when enumDefinition contains a non-string-literal value', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateEnumeration({ name: 'size', enumDefinition: ['sm', 2] });

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/enumDefinition.*string literals/s);
  }).timeout(30000);
});

describe('generateManifest - events', () => {
  const cwd = withTempCwd();

  it('extracts every useEventCallback name', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useEventCallback({ name: 'onClick' });
  ToolJet.useEventCallback({ name: 'onHover' });

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.events).to.deep.equal([{ name: 'onClick' }, { name: 'onHover' }]);
  }).timeout(30000);

  it('throws on a duplicate event name within the same component', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useEventCallback({ name: 'onClick' });
  ToolJet.useEventCallback({ name: 'onClick' });

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/Duplicate event name "onClick"/);
  }).timeout(30000);
});

describe('generateManifest - actions', () => {
  const cwd = withTempCwd();

  it('extracts an action with no params', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.actions).to.deep.equal([{ name: 'reset', displayName: 'Reset' }]);
  }).timeout(30000);

  it('extracts params of every supported type, including select options', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction(
    {
      name: 'configure',
      displayName: 'Configure',
      params: [
        { handle: 'label', displayName: 'Label', type: 'text', defaultValue: 'Hi' },
        { handle: 'enabled', type: 'toggle', defaultValue: true },
        {
          handle: 'size',
          type: 'select',
          defaultValue: 'sm',
          options: [
            { name: 'Small', value: 'sm' },
            { name: 'Large', value: 'lg' },
          ],
        },
        { handle: 'bare' },
      ],
    },
    () => undefined
  );

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.actions).to.deep.equal([
      {
        name: 'configure',
        displayName: 'Configure',
        params: [
          { handle: 'label', displayName: 'Label', defaultValue: 'Hi', type: 'text' },
          { handle: 'enabled', defaultValue: true, type: 'toggle' },
          {
            handle: 'size',
            defaultValue: 'sm',
            type: 'select',
            options: [
              { name: 'Small', value: 'sm' },
              { name: 'Large', value: 'lg' },
            ],
          },
          { handle: 'bare' },
        ],
      },
    ]);
  }).timeout(30000);

  it('omits "params" when the declared params array is empty', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.actions).to.deep.equal([{ name: 'reset' }]);
  }).timeout(30000);

  it('throws when a param is missing its handle', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [{ displayName: 'No handle' }] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/needs a string "handle"/);
  }).timeout(30000);

  it('throws when a param is not an object literal', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: ['label'] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/each param must be an object literal/);
  }).timeout(30000);

  it('throws on a param type outside text/toggle/select', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [{ handle: 'label', type: 'checkbox' }] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(
      /type "checkbox", expected "text", "toggle", or "select"/
    );
  }).timeout(30000);

  it('throws when a select param has no options', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [{ handle: 'size', type: 'select' }] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/type "select" but no non-empty "options"/);
  }).timeout(30000);

  it('throws when a select param has an empty options array', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [{ handle: 'size', type: 'select', options: [] }] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/type "select" but no non-empty "options"/);
  }).timeout(30000);

  it('throws when options entries are missing a string name/value', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction(
    { name: 'reset', params: [{ handle: 'size', type: 'select', options: [{ name: 'Small' }] }] },
    () => undefined
  );

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/string "name" and "value"/);
  }).timeout(30000);

  it('throws when options is not an array literal', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
const SIZES = [{ name: 'Small', value: 'sm' }];

export const Widget = () => {
  ToolJet.useAction({ name: 'reset', params: [{ handle: 'size', type: 'select', options: SIZES }] }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/"options" must be an array literal/);
  }).timeout(30000);

  it('throws on a duplicate action name within the same component', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useAction({ name: 'reset' }, () => undefined);
  ToolJet.useAction({ name: 'reset' }, () => undefined);

  return <div>Widget</div>;
};
`
    );

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/Duplicate action name "reset"/);
  }).timeout(30000);
});

describe('generateManifest - component discovery', () => {
  const cwd = withTempCwd();

  it('includes every component exported from src/index.ts', async () => {
    writeProjectFiles(cwd.get(), {
      'index.ts': `export { Alpha } from './Alpha';\nexport { Beta } from './Beta';\n`,
      'Alpha.tsx': `export const Alpha = () => <div>Alpha</div>;\n`,
      'Beta.tsx': `export const Beta = () => <div>Beta</div>;\n`,
    });

    const { manifest } = await generateManifest(cwd.get());

    expect(Object.keys(manifest.components)).to.have.members(['Alpha', 'Beta']);
  }).timeout(30000);

  it('skips non-component exports instead of listing them as prop-less components', async () => {
    writeProjectFiles(cwd.get(), {
      'index.ts': `export { Widget, VERSION, helper } from './stuff';\nexport type { WidgetProps } from './stuff';\n`,
      'stuff.tsx': `export const VERSION = '1.0.0';
export function helper(a: number): number {
  return a + 1;
}
export interface WidgetProps {
  title: string;
}
export const Widget = () => <div>Widget</div>;
`,
    });

    const { manifest } = await generateManifest(cwd.get());

    expect(Object.keys(manifest.components)).to.deep.equal(['Widget']);
  }).timeout(30000);

  it('recognises a component whose JSX only appears inside a nested helper closure', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export const Widget = () => {
  ToolJet.useStateString({ name: 'title', initialValue: 'Hi' });

  const renderBody = () => <span>body</span>;

  return renderBody();
};
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props.map((p) => p.name)).to.deep.equal(['title']);
  }).timeout(30000);

  it('recognises a component written as a function declaration', async () => {
    writeProject(
      cwd.get(),
      `${SDK_IMPORT}
export function Widget() {
  ToolJet.useStateString({ name: 'title', initialValue: 'Hi' });

  return <div>Widget</div>;
}
`
    );

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget.props.map((p) => p.name)).to.deep.equal(['title']);
  }).timeout(30000);

  it('applies the default 6x5 size when useComponentSettings is absent', async () => {
    writeProject(cwd.get(), `export const Widget = () => <div>Widget</div>;\n`);

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.Widget).to.deep.include({ defaultWidth: 6, defaultHeight: 5 });
  }).timeout(30000);

  it('derives displayName by splitting the export name on case boundaries', async () => {
    writeProjectFiles(cwd.get(), {
      'index.ts': `export { QRCodeGenerator } from './QRCodeGenerator';\n`,
      'QRCodeGenerator.tsx': `export const QRCodeGenerator = () => <div>QR</div>;\n`,
    });

    const { manifest } = await generateManifest(cwd.get());

    expect(manifest.components.QRCodeGenerator.displayName).to.equal('QR Code Generator');
  }).timeout(30000);

  it('throws when src/index.ts does not exist', async () => {
    fs.writeFileSync(path.join(cwd.get(), 'tsconfig.json'), TSCONFIG);
    fs.mkdirSync(path.join(cwd.get(), 'src'), { recursive: true });
    fs.writeFileSync(path.join(cwd.get(), 'src', 'other.ts'), `export {};\n`);

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/Make sure src\/index\.ts exists/);
  }).timeout(30000);

  it('throws when tsconfig.json is not readable as JSON', async () => {
    writeProject(cwd.get(), `export const Widget = () => <div>Widget</div>;\n`);
    fs.writeFileSync(path.join(cwd.get(), 'tsconfig.json'), '{ not valid json');

    await expect(generateManifest(cwd.get())).to.be.rejectedWith(/Invalid tsconfig\.json/);
  }).timeout(30000);
});

describe('generateManifest - TypeScript diagnostics', () => {
  const cwd = withTempCwd();

  it('reports zero errors and an empty report for a clean project', async () => {
    writeProject(cwd.get(), `export const Widget = () => <div>Widget</div>;\n`);

    const { tsErrorCount, tsErrorReport } = await generateManifest(cwd.get());

    expect(tsErrorCount).to.equal(0);
    expect(tsErrorReport).to.equal('');
  }).timeout(30000);

  it('counts and formats every error in a file with more than one', async () => {
    writeProject(
      cwd.get(),
      `export const Widget = () => <div>Widget</div>;

const a: number = 'not a number';
const b: string = 42;
export { a, b };
`
    );

    const { manifest, tsErrorCount, tsErrorReport } = await generateManifest(cwd.get());

    expect(tsErrorCount).to.equal(2);
    expect(tsErrorReport).to.include('index.tsx');
    // TS errors are reported, not fatal — the manifest is still produced.
    expect(manifest.components).to.have.property('Widget');
  }).timeout(30000);
});
