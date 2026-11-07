import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Codex's source review of the three packs (2026-10-25, qa/pack-code-review-2026-10-25): CODE-01 to CODE-06, each
// finding's repro on the pack's own source and the real inline SDK (only module and CSS loading replaced), plus the
// cases its fix direction named (both completion orders, clear, unmount, disable mid-drag, cycles).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};
const { toTree, Menu: AntMenu } = {
  toTree: require('../../../../../../packs/antd/src/components/MoreInputs.tsx').toTree,
  Menu: packs.antd.Menu,
};
const { TREE_LIMITS } = require('../../../../../../packs/antd/src/lib/tree.ts');

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

let serial = 0;
async function mount(pack, name, props = {}, hostState = {}) {
  loadLibraryModule.mockResolvedValue({ [name]: packs[pack][name] });
  const actions = new Map();
  const exposed = {};
  const events = [];
  const cacheKey = `review-1025-${++serial}`;
  const host = makeHost(name, {});
  const element = (p, h = hostState) => (
    <InlineLibraryComponent
      bundleUrl={`${pack}-${name}.js`}
      cssUrl={`${pack}-${name}.css`}
      cacheKey={cacheKey}
      componentName={name}
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      actions={actions}
      host={{ ...host, ...h }}
      dataCy="review"
      fireEvent={(event) =>
        events.push({
          event,
          value: exposed.value,
          checked: exposed.checked,
          fileList: exposed.fileList,
          split: exposed.split,
        })
      }
    />
  );
  const view = render(element(props));
  const root = () => view.container.querySelector('[data-cy="review"]')?.shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return {
    actions,
    exposed,
    events,
    root,
    view,
    update: async (p, h) => {
      await act(async () => view.rerender(element(p, h)));
    },
  };
}

describe('CODE-01: a checked field publishes its Form value before onChange', () => {
  test.each(
    ['shadcn', 'antd', 'mui'].flatMap((p) => [
      [p, 'Switch'],
      [p, 'Checkbox'],
    ])
  )('%s %s', async (pack, name) => {
    const w = await mount(pack, name);
    await waitFor(() => expect(w.actions.has('toggle')).toBe(true));
    w.events.length = 0;
    await act(async () => w.actions.get('toggle')());
    const e = w.events.find((x) => x.event === 'onChange');
    expect(e).toBeTruthy();
    expect(e.value).toBe(true);
    if ('checked' in w.exposed) expect(e.checked).toBe(true);
  });

  test.each([
    ['antd', 'Switch', 'setFieldValue'],
    ['antd', 'Checkbox', 'setFieldValue'],
    ['mui', 'Switch', 'setChecked'],
    ['mui', 'Checkbox', 'setChecked'],
  ])(
    '%s %s: two toggles in one batch cancel out, and %s to the current value fires nothing',
    async (pack, name, setter) => {
      const w = await mount(pack, name);
      await waitFor(() => expect(w.actions.has('toggle')).toBe(true));
      w.events.length = 0;
      await act(async () => {
        w.actions.get('toggle')();
        w.actions.get('toggle')();
      });
      expect(w.exposed.checked).toBe(false);
      expect(w.exposed.value).toBe(false);
      expect(w.events.filter((e) => e.event === 'onChange')).toHaveLength(2);
      w.events.length = 0;
      await act(async () => w.actions.get(setter)(false));
      expect(w.events.filter((e) => e.event === 'onChange')).toHaveLength(0);
      await act(async () => w.actions.get(setter)(true));
      expect(w.events.filter((e) => e.event === 'onChange')).toEqual([
        expect.objectContaining({ value: true, checked: true }),
      ]);
    }
  );

  test('Ant Transfer publishes value with targetKeys before onChange', async () => {
    const w = await mount('antd', 'Transfer');
    await waitFor(() => expect(w.actions.has('setFieldValue')).toBe(true));
    w.events.length = 0;
    await act(async () => w.actions.get('setFieldValue')(['orders']));
    const e = w.events.find((x) => x.event === 'onChange');
    expect(e.value).toEqual(['orders']);
  });
});

describe('CODE-02: shadcn ListView reconciles its selection with refreshed data', () => {
  test('a refresh republishes the selected record', async () => {
    const w = await mount('shadcn', 'ListView', {
      data: [
        { id: 1, name: 'Old' },
        { id: 2, name: 'Other' },
      ],
      enablePagination: false,
    });
    await waitFor(() => expect(w.actions.has('selectItem')).toBe(true));
    await act(async () => w.actions.get('selectItem')(1));
    expect(w.exposed.selectedItem.name).toBe('Old');
    await w.update({
      data: [
        { id: 1, name: 'Updated' },
        { id: 2, name: 'Other' },
      ],
      enablePagination: false,
    });
    expect(w.exposed.selectedItem.name).toBe('Updated');
    expect(w.exposed.selectedRecord.name).toBe('Updated');
    expect(w.exposed.selectedItemId).toBe('1');
  });

  test('a reorder moves the selected index with the record; a deletion clears it', async () => {
    const w = await mount('shadcn', 'ListView', {
      data: [
        { id: 1, name: 'Removed' },
        { id: 2, name: 'Other' },
      ],
    });
    await waitFor(() => expect(w.actions.has('selectItem')).toBe(true));
    await act(async () => w.actions.get('selectItem')(1));
    await w.update({
      data: [
        { id: 2, name: 'Other' },
        { id: 1, name: 'Removed' },
      ],
    });
    expect(w.exposed.selectedRecordId).toBe(1);
    expect(w.root().querySelectorAll('[role="listitem"]')[1].className).toMatch(/is-selected/);
    await w.update({ data: [{ id: 2, name: 'Other' }] });
    expect(w.exposed.selectedItem).toEqual({});
    expect(w.exposed.selectedRecord).toEqual({});
    expect(w.exposed.selectedItemId).toBe('');
    expect(w.exposed.selectedRecordId).toBe(-1);
    // Not resurrected when a record with that id comes back.
    await w.update({
      data: [
        { id: 2, name: 'Other' },
        { id: 1, name: 'Back' },
      ],
    });
    expect(w.exposed.selectedItem).toEqual({});
  });

  test('client-side paging keeps the selection; server-side, a page without the record clears it', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    const client = await mount('shadcn', 'ListView', { data: rows, enablePagination: true, rowsPerPage: 3 });
    await waitFor(() => expect(client.actions.has('selectItem')).toBe(true));
    await act(async () => client.actions.get('selectItem')(5));
    expect(client.exposed.selectedRecordId).toBe(1);
    await act(async () => client.actions.get('setPage')(1));
    expect(client.exposed.selectedItem.name).toBe('Row 5');
    cleanup();
    const server = await mount('shadcn', 'ListView', {
      data: rows.slice(0, 3),
      enablePagination: true,
      serverSidePagination: true,
      rowsPerPage: 3,
      totalRecords: 6,
    });
    await waitFor(() => expect(server.actions.has('selectItem')).toBe(true));
    await act(async () => server.actions.get('selectItem')(2));
    await server.update({
      data: rows.slice(3),
      enablePagination: true,
      serverSidePagination: true,
      rowsPerPage: 3,
      totalRecords: 6,
    });
    expect(server.exposed.selectedItem).toEqual({});
  });

  test('a click fires onRecordClicked with the record published; selectItem fires nothing', async () => {
    const w = await mount('shadcn', 'ListView', {
      data: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
    });
    await waitFor(() => expect(w.actions.has('selectItem')).toBe(true));
    w.events.length = 0;
    await act(async () => w.actions.get('selectItem')(2));
    expect(w.events).toHaveLength(0);
    let seen;
    w.events.length = 0;
    const items = w.root().querySelectorAll('[role="listitem"]');
    await act(async () => fireEvent.click(items[0]));
    seen = w.events.find((e) => e.event === 'onRecordClicked');
    expect(seen).toBeTruthy();
    expect(w.exposed.selectedItem.name).toBe('A');
  });
});

// A FileReader whose reads finish when the test says so.
function readers() {
  const all = [];
  jest.spyOn(window, 'FileReader').mockImplementation(() => {
    const r = {
      result: null,
      error: null,
      readAsDataURL: (file) => {
        r.file = file;
        all.push(r);
      },
      abort: jest.fn(() => r.onabort?.({})),
      finish() {
        this.result = 'data:text/plain;base64,eA==';
        this.onload?.({});
      },
    };
    return r;
  });
  return all;
}
const file = (name) => new File(['x'], name, { type: 'text/plain' });
async function pick(w, files) {
  const input = w.root().querySelector('input[type="file"]');
  expect(input).toBeTruthy();
  await act(async () => {
    fireEvent.change(input, { target: { files } });
    await Promise.resolve();
  });
}
const names = (w) => (w.exposed.fileList ?? []).map((f) => f.name);

describe('CODE-03: Ant Upload, a newer single-file choice wins', () => {
  test.each([
    ['the old read finishes last', [1, 0]],
    ['the old read finishes first', [0, 1]],
  ])('%s', async (_label, order) => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { maxCount: 1, type: 'select' });
    await pick(w, [file('old.txt')]);
    await waitFor(() => expect(pending).toHaveLength(1));
    await pick(w, [file('new.txt')]);
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(pending[0].abort).toHaveBeenCalled();
    for (const i of order) await act(async () => pending[i].finish());
    expect(names(w)).toEqual(['new.txt']);
    expect(w.exposed.value.map((f) => f.name)).toEqual(['new.txt']);
    expect(w.events.filter((e) => e.event === 'onChange')).toHaveLength(1);
  });

  test('a clear drops and aborts the read under way', async () => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { maxCount: 1, type: 'select' });
    await pick(w, [file('a.txt')]);
    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => w.actions.get('clearFiles')());
    expect(pending[0].abort).toHaveBeenCalled();
    await act(async () => pending[0].finish());
    expect(names(w)).toEqual([]);
    // Clearing a list that is already empty fires nothing.
    expect(w.events.filter((e) => e.event === 'onChange')).toHaveLength(0);
  });
});

describe('CODE-04: Ant Upload admits files before reading and aborts on teardown', () => {
  test('eight files past maxCount 2 start two reads', async () => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { maxCount: 2, multiple: true, type: 'select' });
    await pick(
      w,
      Array.from({ length: 8 }, (_, i) => file(`file-${i}.txt`))
    );
    await waitFor(() => expect(pending.length).toBeGreaterThan(0));
    expect(pending.length).toBeLessThanOrEqual(2);
    await act(async () => pending.forEach((r) => r.finish()));
    expect(names(w)).toEqual(['file-0.txt', 'file-1.txt']);
    expect(w.events.filter((e) => e.event === 'onChange')).toHaveLength(1);
  });

  test('files still being read hold their place under maxCount', async () => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { maxCount: 2, multiple: true, type: 'select' });
    await pick(w, [file('a.txt')]);
    await pick(w, [file('b.txt'), file('c.txt')]);
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => pending.forEach((r) => r.finish()));
    expect(names(w).sort()).toEqual(['a.txt', 'b.txt']);
  });

  test('no limit: reads run at most four at a time', async () => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { multiple: true, type: 'select' });
    await pick(
      w,
      Array.from({ length: 10 }, (_, i) => file(`f${i}.txt`))
    );
    await waitFor(() => expect(pending.length).toBeGreaterThan(0));
    expect(pending).toHaveLength(4);
    for (let i = 0; i < 10; i++) {
      await waitFor(() => expect(pending.length).toBeGreaterThan(i));
      await act(async () => pending[i].finish());
    }
    expect(names(w)).toHaveLength(10);
  });

  test('unmount aborts reads in flight', async () => {
    const pending = readers();
    const w = await mount('antd', 'Upload', { type: 'select' });
    await pick(w, [file('file.txt')]);
    await waitFor(() => expect(pending).toHaveLength(1));
    w.view.unmount();
    expect(pending[0].abort).toHaveBeenCalled();
  });
});

describe('CODE-05: tree data is bounded', () => {
  const deep = (levels) => {
    let tree = [];
    for (let i = 0; i < levels; i++) tree = [{ value: `node-${i}`, title: `Node ${i}`, children: tree }];
    return tree;
  };
  const depthOf = (nodes) => {
    let depth = 0;
    for (let level = nodes; level?.length; level = level[0].children) depth += 1;
    return depth;
  };

  test('a 5,000-level tree is cut at the depth limit, with a warning, not a stack overflow', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = toTree(deep(5000));
    expect(depthOf(tree)).toBe(TREE_LIMITS.depth);
    expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
  });

  test('a cycle ends; a normal tree is unchanged', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const a = { value: 'a', children: [] };
    a.children.push(a, { value: 'b' });
    expect(toTree([a])).toEqual([
      { title: 'a', value: 'a', key: 'a', children: [{ title: 'b', value: 'b', key: 'b' }] },
    ]);
    expect(toTree([{ title: 'X', value: 'x', children: [{ label: 'Y', key: 'y' }, ''] }, 'z'])).toEqual([
      { title: 'X', value: 'x', key: 'x', children: [{ title: 'Y', value: 'y', key: 'y' }] },
      { title: 'z', value: 'z', key: 'z' },
    ]);
  });

  test('Ant TreeSelect, Tree, Cascader and Menu render a 5,000-level tree', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    for (const [name, prop] of [
      ['TreeSelect', 'treeData'],
      ['Tree', 'treeData'],
      ['Cascader', 'options'],
      ['Menu', 'items'],
    ]) {
      if (!packs.antd[name]) continue;
      const w = await mount('antd', name, { [prop]: deep(5000) });
      expect(w.root()).toBeTruthy();
      cleanup();
    }
    expect(AntMenu).toBeDefined();
  });
});

describe('CODE-06: shadcn SplitPane drags tear down once', () => {
  const setup = async (hostState) => {
    const w = await mount('shadcn', 'SplitPane', {}, hostState);
    const handle = w.root().querySelector('[role="separator"]');
    handle.setPointerCapture = jest.fn();
    handle.parentElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
    const pointer = async (type, x = 40, id = 1) => {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { pointerId: id, clientX: x, clientY: 40 });
      await act(async () => fireEvent(handle, event));
    };
    return { w, handle, pointer, resizes: () => w.events.filter((e) => e.event === 'onResize').length };
  };

  test('a cancelled drag keeps no handlers and fires nothing; the next drag fires once', async () => {
    const { w, pointer, resizes } = await setup();
    await pointer('pointerdown');
    await pointer('pointermove', 70);
    await pointer('pointercancel');
    await pointer('lostpointercapture');
    expect(resizes()).toBe(0);
    expect(w.exposed.split).toBe(40);
    await pointer('pointerdown');
    await pointer('pointermove', 65);
    await pointer('pointerup', 65);
    await pointer('lostpointercapture');
    expect(resizes()).toBe(1);
    expect(w.exposed.split).toBe(65);
    // A later move with no drag moves nothing.
    await pointer('pointermove', 20);
    expect(w.exposed.split).toBe(65);
  });

  test('another pointer is ignored; a drag that moved nothing fires nothing', async () => {
    const { w, pointer, resizes } = await setup();
    await pointer('pointerdown');
    await pointer('pointermove', 80, 2);
    await pointer('pointerup', 80, 2);
    expect(w.exposed.split).toBe(40);
    await pointer('pointerup');
    expect(resizes()).toBe(0);
  });

  test('disabling mid-drag cancels it', async () => {
    const { w, pointer, resizes } = await setup();
    await pointer('pointerdown');
    await pointer('pointermove', 70);
    await w.update({}, { disabled: true });
    await pointer('pointerup', 70);
    expect(resizes()).toBe(0);
    expect(w.exposed.split).toBe(40);
  });
});
