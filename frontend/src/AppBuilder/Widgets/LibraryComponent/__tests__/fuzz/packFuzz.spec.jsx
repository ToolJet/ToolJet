import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './packTestEnv';

installBrowserStubs();

// Every component of every first-party pack, fed the values a binding gives before and after its data loads (null,
// NaN, a number where text is expected, an empty or a large list, an object, a long string), one property at a time.
// A component must never crash, loop or throw for any of them: one rogue widget must not take down an app (a
// numeric trendLabel made the StatCard re-render until React gave up, 2026-10-23). The pack's own source, the inline
// SDK and the host renderer are the real ones; only module and CSS loading is replaced.
//
//   Opt-in (about 30 minutes for all three packs): PACK_FUZZ=shadcn,antd,mui · PACK_FUZZ_ONLY=Select,DataTable ·
//   PACK_FUZZ_OUT=<file> writes the report. freshDrop.spec.jsx runs every time.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK_SOURCES = {
  shadcn: () => require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: () => require('../../../../../../../packs/antd/src/index.ts'),
  mui: () => require('../../../../../../../packs/mui/src/index.ts'),
};
const PACKS_DIR = path.resolve(__dirname, '../../../../../../../packs');
const packs = (process.env.PACK_FUZZ || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .filter((pack) => fs.existsSync(path.join(PACKS_DIR, pack, 'dist/manifest.json')));
const only = new Set(
  (process.env.PACK_FUZZ_ONLY || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
);

const bigList = Array.from({ length: 1500 }, (_, i) => ({
  id: i,
  name: `Row ${i}`,
  value: i * 3,
  status: i % 2 ? 'Open' : 'Closed',
}));
const HOSTILE = [
  ['null', null],
  ['NaN', NaN],
  ['number', 7],
  ['text', 'text'],
  ['empty list', []],
  ['object', { a: 1 }],
  ['mixed list', [null, 1, 'a', {}, [], NaN]],
  ['large list', bigList],
  ['long text', 'x'.repeat(20000)],
];

// A step that keeps rendering (a setState in an effect on every commit) never returns from act(); the step throws from
// createElement once it has made this many elements, which ends it synchronously.
const ELEMENT_BUDGET = 400000;
const realCreateElement = React.createElement;
let elements = 0;
let budgetHit = false;
React.createElement = (...args) => {
  elements += 1;
  if (elements > ELEMENT_BUDGET) {
    budgetHit = true;
    throw new Error('render loop: element budget exceeded');
  }
  return realCreateElement(...args);
};

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

const LOOP = /Too many re-renders|Maximum update depth|render loop/;

if (!packs.length) test.skip('pack fuzz (set PACK_FUZZ=shadcn,antd,mui to run it)', () => {});

describe.each(packs)('the %s pack under hostile bindings', (pack) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'), 'utf8'));
  const source = PACK_SOURCES[pack]();
  const names = Object.keys(manifest.components).filter((name) => !only.size || only.has(name));
  const failures = [];

  afterAll(() => {
    if (process.env.PACK_FUZZ_OUT)
      fs.appendFileSync(process.env.PACK_FUZZ_OUT, JSON.stringify({ pack, failures }) + '\n');
  });

  test.each(names)(
    '%s',
    async (name) => {
      const Component = source[name];
      expect(Component).toBeDefined();
      loadLibraryModule.mockResolvedValue({ [name]: Component });
      const entry = manifest.components[name];
      const defaults = Object.fromEntries(
        (entry.props ?? []).filter((p) => p.default !== undefined).map((p) => [p.name, p.default])
      );
      const host = makeHost(name, entry);
      const problems = [];
      const errors = [];
      // The component registers its actions here (ToolJet.useAction), as the host's action runner reads them.
      const actions = new Map();
      const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const text = args.map(String).join(' ');
        if (LOOP.test(text)) errors.push(text.slice(0, 200));
      });
      const view = (props) => (
        <Boundary onError={(error) => errors.push(String(error?.message ?? error).slice(0, 200))}>
          <InlineLibraryComponent
            bundleUrl={`${pack}-${name}.js`}
            cssUrl={`${pack}-${name}.css`}
            cacheKey={`fuzz-${pack}-${name}`}
            componentName={name}
            componentProps={props}
            componentStyles={{}}
            renderSlot={() => null}
            setExposedVariable={() => {}}
            fireEvent={() => {}}
            actions={actions}
            host={host}
            dataCy="fuzz"
          />
        </Boundary>
      );
      // A step this slow is a defect (a binding to a large list must not freeze the page), and it is reported rather
      // than left to the test timeout: jest would move on while it still renders and break the components after it.
      // jsdom has no layout, so grids cannot virtualize and a 1500-row list takes 8-40 s here; the freezes this
      // catches (a canvas per item: Accordion, Tabs, Collapse) took 10 to 90 minutes.
      const SLOW_STEP_MS = 45000;
      let tooSlow = false;
      const step = async (label, fn) => {
        if (tooSlow) return;
        elements = 0;
        budgetHit = false;
        errors.length = 0;
        const started = Date.now();
        try {
          await act(async () => {
            fn();
            await new Promise((resolve) => setTimeout(resolve, 0));
          });
        } catch (error) {
          errors.push(String(error?.message ?? error).slice(0, 200));
        }
        if (budgetHit) errors.push('render loop: element budget exceeded');
        if (Date.now() - started > SLOW_STEP_MS) {
          tooSlow = true;
          errors.push(`took ${Date.now() - started} ms (the rest of this component is skipped)`);
        }
        if (errors.length) problems.push(`${label}: ${[...new Set(errors)].join(' | ')}`);
      };

      let rendered;
      await step('defaults', () => {
        rendered = render(view(defaults));
      });
      // Every action the manifest offers (the inspector lists them) is one the component handles.
      const unregistered = (entry.actions ?? []).map((a) => a.name).filter((n) => !actions.has(n));
      if (unregistered.length)
        problems.push(`actions the manifest lists but the component does not register: ${unregistered.join(', ')}`);
      for (const prop of entry.props ?? []) {
        for (const [label, value] of HOSTILE) {
          await step(`${prop.name} = ${label}`, () => rendered.rerender(view({ ...defaults, [prop.name]: value })));
        }
        await step(`${prop.name} back to default`, () => rendered.rerender(view(defaults)));
      }
      // Every action, called the way a query or event can call it: no arguments, junk ones, and the hostile values.
      // An action may refuse junk (throw or ignore it) but must never crash the component or loop.
      for (const action of entry.actions ?? []) {
        for (const [label, args] of [['no arguments', []], ...HOSTILE.map(([l, v]) => [l, [v, v]])]) {
          await step(`${action.name}(${label})`, () => {
            const run = actions.get(action.name);
            try {
              const result = run?.(...args);
              if (result && typeof result.catch === 'function') result.catch(() => {});
            } catch {
              // Refusing junk arguments is allowed; only a crash or a loop of the component is not.
            }
          });
        }
        await step(`${action.name} back to default`, () => rendered.rerender(view(defaults)));
      }
      consoleError.mockRestore();
      cleanup();
      if (problems.length) failures.push({ component: name, problems });
      expect(problems).toEqual([]);
    },
    // A component steps through every property and action with every hostile value, a few slow list steps each.
    900000
  );
});
