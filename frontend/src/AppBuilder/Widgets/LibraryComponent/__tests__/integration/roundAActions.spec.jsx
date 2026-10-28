import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import * as shadcn from '../../../../../../../packs/shadcn/src/index.ts';
import * as antd from '../../../../../../../packs/antd/src/index.ts';
import * as mui from '../../../../../../../packs/mui/src/index.ts';

installBrowserStubs();

// Round A of the 2026-10-25 overnight stress (fuzz/packActions.spec.jsx): actions an event handler runs one after
// another before React renders again build on each other, an action never publishes a value of the wrong type or one
// the component does not draw, and a change event fires after the value it reports is exposed.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const mount = async (pack, name, props = {}) => {
  const Component = { shadcn, antd, mui }[pack][name];
  loadLibraryModule.mockResolvedValue({ [name]: Component });
  const exposed = {};
  const events = [];
  const actions = new Map();
  render(
    <InlineLibraryComponent
      bundleUrl={`${pack}-${name}.js`}
      cssUrl={`${pack}-${name}.css`}
      cacheKey={`round-a-${pack}-${name}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push({ event, exposed: { ...exposed } })}
      actions={actions}
      host={makeHost(name, {})}
      dataCy="round-a"
    />
  );
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  // Calls in one frame, as an event handler's actions run: each a microtask after the last, no render between.
  const burst = (action, args, times) =>
    act(async () => {
      const runs = [];
      for (let i = 0; i < times; i++) runs.push(Promise.resolve().then(() => actions.get(action)(...args)));
      await Promise.all(runs);
    });
  const run = (action, ...args) => act(async () => actions.get(action)(...args));
  // Several different calls in one frame.
  const frame = (calls) =>
    act(async () => {
      await Promise.all(calls.map(([action, ...args]) => Promise.resolve().then(() => actions.get(action)(...args))));
    });
  const count = (event) => events.filter((e) => e.event === event).length;
  return { exposed, events, burst, run, frame, count };
};

describe('pack actions called one after another in one frame', () => {
  it.each(['Checkbox', 'Switch'])('shadcn %s: two toggles flip twice and fire twice', async (name) => {
    const c = await mount('shadcn', name);
    expect(c.exposed.value).toBe(false);
    await c.burst('toggle', [], 2);
    expect(c.exposed.value).toBe(false);
    expect(c.count('onChange')).toBe(2);
    await c.burst('setValue', [true], 3);
    expect(c.exposed.value).toBe(true);
    expect(c.count('onChange')).toBe(3);
  });

  it('shadcn Stepper: two nextTab calls move two steps; setTab to an unknown id stays put', async () => {
    const c = await mount('shadcn', 'Stepper');
    await c.burst('nextTab', [], 2);
    expect(c.exposed.currentStepIndex).toBe(2);
    expect(c.count('onStepChange')).toBe(2);
    // onStepChange's handlers read the step it moved to.
    expect(c.events.filter((e) => e.event === 'onStepChange').map((e) => e.exposed.currentStepIndex)).toEqual([1, 2]);
    await c.run('setTab', 'no-such-step');
    expect(c.exposed.currentStepIndex).toBe(2);
  });

  it('shadcn AccordionContainer: openSection builds on the last call and ignores unknown ids', async () => {
    const c = await mount('shadcn', 'AccordionContainer');
    await c.run('collapseAll');
    await c.frame(['general', 'billing', 'nope'].map((id) => ['openSection', id]));
    expect(c.exposed.openSections).toEqual(['general', 'billing']);
    await c.run('expand', 'nope');
    expect(c.exposed.openSections).toEqual(['general', 'billing']);
  });

  it('shadcn TagsInput: two selectTags calls keep both tags', async () => {
    const c = await mount('shadcn', 'TagsInput', { defaultValue: [], suggestions: [] });
    await c.frame([
      ['selectTags', ['alpha']],
      ['selectTags', ['beta']],
    ]);
    expect(c.exposed.values).toEqual(['alpha', 'beta']);
  });

  it('shadcn Form: setValues merges calls and takes no list', async () => {
    const c = await mount('shadcn', 'Form');
    await c.frame([
      ['setValues', { name: 'Ada' }],
      ['setValues', { email: 'ada@example.com' }],
    ]);
    await c.run('setValues', ['name']);
    expect(c.exposed.data).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
    expect(c.exposed.data).not.toHaveProperty('0');
  });

  it('mui Menu: open twice fires onOpen once', async () => {
    const c = await mount('mui', 'Menu');
    await c.burst('open', [], 2);
    expect(c.exposed.open).toBe(true);
    expect(c.count('onOpen')).toBe(1);
  });
});

describe('pack action values', () => {
  it('shadcn Stat: setPrimaryValue(NaN) is empty, not NaN', async () => {
    const c = await mount('shadcn', 'Stat');
    await c.run('setPrimaryValue', NaN);
    expect(c.exposed.value).toBe('');
    expect(c.exposed.primaryValue).toBe('');
  });

  it('mui ToggleButtonGroup: setValue("") exposes "" (text), not null', async () => {
    const c = await mount('mui', 'ToggleButtonGroup');
    await c.run('setValue', '');
    expect(c.exposed.value).toBe('');
  });

  it('mui StatCard: setTrend with a NaN label keeps the label', async () => {
    const c = await mount('mui', 'StatCard');
    const before = c.exposed.trendLabel;
    await c.run('setTrend', 'up', NaN);
    expect(c.exposed.trendLabel).toBe(before);
  });

  it('antd Slider: setFieldValue(1.5) on a step of 1 exposes what the thumb draws', async () => {
    const c = await mount('antd', 'Slider');
    await c.run('setFieldValue', 1.5);
    expect(c.exposed.value).toBe(2);
  });

  it('mui DataGrid: setPage past the end stays on the last page, exposed before any event, with none fired', async () => {
    const c = await mount('mui', 'DataGrid');
    await c.run('setPage', 99);
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    expect(c.exposed.paginationModel.page).toBe(0);
    expect(c.count('onPaginationModelChange')).toBe(0);
  });
});
