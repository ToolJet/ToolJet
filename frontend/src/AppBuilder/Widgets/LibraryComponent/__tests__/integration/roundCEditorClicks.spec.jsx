import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import * as shadcn from '../../../../../../../packs/shadcn/src/index.ts';
import * as antd from '../../../../../../../packs/antd/src/index.ts';
import * as mui from '../../../../../../../packs/mui/src/index.ts';

installBrowserStubs();

// Round C of the 2026-10-25 overnight stress, editor lifecycle.
// C-05: a Kanban (every pack) and the Map marked their whole root [data-tj-no-drag], so the host stopped every press at
// the widget and the editor, which selects on that press, never selected them (inside a container the click selected
// the container). The first press now goes through; only presses after it, until a press elsewhere, are held for card
// drags and map panning.
// C-06: an onChange handler that toggles its own Switch or Checkbox ran toggle, onChange, toggle, ... as microtasks
// without end and froze the editor (MUI, where a click on the control toggles it in the editor).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACKS = { shadcn, antd, mui };
const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
];
const CARDS = [
  { id: 1, title: 'Load 1', status: 'todo' },
  { id: 2, title: 'Load 2', status: 'doing' },
];

let mounts = 0;
const mount = async (pack, name, props, onEvent) => {
  const Component = PACKS[pack][name];
  loadLibraryModule.mockResolvedValue({ [name]: Component });
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${pack}-${name}.js`}
      cssUrl={`${pack}-${name}.css`}
      cacheKey={`round-c-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => {
        events.push(event);
        onEvent?.(event, actions);
      }}
      actions={actions}
      host={makeHost(name, {})}
      dataCy="round-c"
    />
  );
  const root = () => view.container.querySelector('[data-cy="round-c"]')?.shadowRoot;
  return { root, exposed, events, actions };
};

const press = (target, type) =>
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, composed: true }));
  });

describe.each([
  ['shadcn', 'Kanban', { data: CARDS, columns: COLUMNS }, '[data-kb-card]'],
  ['antd', 'Kanban', { dataSource: CARDS, columns: COLUMNS }, '[data-kb-card]'],
  ['mui', 'Kanban', { data: CARDS, columns: COLUMNS }, '[data-kb-card]'],
  ['shadcn', 'Map', {}, '.ui-map'],
  ['antd', 'Map', {}, '.ui-map'],
])('C-05 %s %s in the editor', (pack, name, props, part) => {
  test('the first press reaches the editor (selects), the next ones are held, a press elsewhere starts over', async () => {
    const w = await mount(pack, name, props);
    await waitFor(() => expect(w.root()?.querySelector(part)).toBeTruthy());
    const el = w.root().querySelector(part);
    expect(w.root().querySelector('[data-tj-no-drag]')).toBeNull();
    const seen = jest.fn();
    document.addEventListener('mousedown', seen);
    try {
      press(el, 'pointerdown');
      press(el, 'mousedown');
      expect(seen).toHaveBeenCalledTimes(1);
      press(el, 'pointerup');
      expect(w.root().querySelector('[data-tj-no-drag]')).toBeTruthy();
      press(el, 'pointerdown');
      press(el, 'mousedown');
      expect(seen).toHaveBeenCalledTimes(1);
      press(el, 'pointerup');
      press(document.body, 'pointerdown');
      expect(w.root().querySelector('[data-tj-no-drag]')).toBeNull();
      press(el, 'mousedown');
      expect(seen).toHaveBeenCalledTimes(2);
    } finally {
      document.removeEventListener('mousedown', seen);
    }
  });
});

describe.each(['shadcn', 'antd', 'mui'].flatMap((pack) => [
  [pack, 'Switch'],
  [pack, 'Checkbox'],
]))('C-06 %s %s', (pack, name) => {
  test('an onChange handler that toggles the widget itself stops instead of looping', async () => {
    // As the host runs a handler's action: a microtask after the event.
    const w = await mount(pack, name, {}, (event, actions) => {
      if (event === 'onChange') Promise.resolve().then(() => actions.get('toggle')?.());
    });
    await waitFor(() => expect(w.actions.get('toggle')).toBeTruthy());
    await act(async () => {
      await w.actions.get('toggle')();
      for (let i = 0; i < 1000; i++) await Promise.resolve();
    });
    const fired = w.events.filter((e) => e === 'onChange').length;
    expect(fired).toBeGreaterThan(1);
    expect(fired).toBeLessThanOrEqual(100);
    // The next task starts a fresh count: a later toggle still fires its onChange.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
    w.events.length = 0;
    await act(async () => {
      await w.actions.get('toggle')();
      for (let i = 0; i < 1000; i++) await Promise.resolve();
    });
    expect(w.events.filter((e) => e === 'onChange').length).toBeGreaterThan(0);
  });
});
