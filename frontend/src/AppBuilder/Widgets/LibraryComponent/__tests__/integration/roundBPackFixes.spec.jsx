import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { pieLegendPlace } from '../../../../../../../packs/mui/src/lib/chartLegend';
import { evenSample, sampledNote } from '../../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel';

installBrowserStubs();

// Round B of the 2026-10-25 overnight stress (browser soak and large data), pack side: the Ant CardGrid draws its
// cards a screenful at a time (B-01), the MUI Select menu draws at most 500 options (B-02), the shadcn ScatterChart says
// when it samples its points (B-04), rings fit a narrow box (B-05), the MUI pie's legend gives way in one (B-06) and the
// Ant Table keeps its row highlight and its Tags through rapid data updates (B-08). The pack components, the inline SDK
// and the host renderer are the real ones; only module and CSS loading is replaced, and layout reads are stubbed.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const SOURCE = {
  shadcn: require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../../packs/mui/src/index.ts'),
};

let mounts = 0;
const mount = async (pack, name, props = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE[pack][name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  let state = { props };
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`rb-${mounts}.js`}
      cssUrl={`rb-${mounts}.css`}
      cacheKey={`round-b-${pack}-${name}-${mounts}`}
      componentName={name}
      componentProps={state.props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy="rb-widget"
    />
  );
  let view;
  await act(async () => {
    view = render(element());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="rb-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  const update = (next) =>
    act(async () => {
      state = { props: { ...state.props, ...next } };
      view.rerender(element());
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { root, exposed, events, update };
};
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));

/** Every element matching `sel` in the document and its open shadow roots (popups portal into the popup layer). */
const deepAll = (sel, from = document) => {
  const found = [...from.querySelectorAll(sel)];
  for (const el of from.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(sel, el.shadowRoot));
  return found;
};

// Layout stubs on Element.prototype for elements matching `pick`, the real getter otherwise.
const stubs = [];
const stubLayout = (prop, pick) => {
  const proto = Element.prototype;
  const real = Object.getOwnPropertyDescriptor(proto, prop);
  stubs.push(() => Object.defineProperty(proto, prop, real));
  Object.defineProperty(proto, prop, {
    configurable: true,
    get() {
      const hit = pick(this);
      return hit === undefined ? real.get.call(this) : hit;
    },
  });
};
// A ResizeObserver that runs its callback on observe, as a browser does once it lays the element out.
const RealRO = window.ResizeObserver;
const liveObserver = () => {
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      this.cb([], this);
    }
    unobserve() {}
    disconnect() {}
  };
};
// An IntersectionObserver whose targets the test brings into view.
const RealIO = window.IntersectionObserver;
let observed = [];
// The grid's end marker (Ant's Typography ellipsis observes too).
const sentinelEntry = () => [...observed].reverse().find((o) => o.el.classList?.contains('tj-ant-grow-sentinel'));
const fakeIntersection = () => {
  observed = [];
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      observed.push({ el, by: this, fire: () => this.cb([{ target: el, isIntersecting: true }], this) });
    }
    unobserve() {}
    disconnect() {
      observed = observed.filter((o) => o.by !== this);
    }
  };
};

afterEach(() => {
  while (stubs.length) stubs.pop()();
  window.ResizeObserver = RealRO;
  window.IntersectionObserver = RealIO;
  document.body.innerHTML = '';
});

const items = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    category: `Cat ${i % 3}`,
    description: 'd',
  }));

describe('B-01: the Ant CardGrid draws its cards a screenful at a time', () => {
  it('draws 48 of 200 cards, 48 more each time the end comes into view, and selects by key', async () => {
    fakeIntersection();
    const c = await mount('antd', 'CardGrid', { dataSource: items(200) });
    const cards = () => c.root().querySelectorAll('.tj-ant-gridcard');
    expect(cards()).toHaveLength(48);
    await act(async () => sentinelEntry().fire());
    await settle();
    expect(cards()).toHaveLength(96);
    // A click on a drawn card exposes it, as before.
    fireEvent.click(cards()[60]);
    await settle();
    expect(c.exposed.selectedItem).toMatchObject({ id: 61 });
    expect(c.exposed.selectedItemIndex).toBe(60);
    expect(cards()[60].className).toContain('is-selected');
    // A refresh with the same rows keeps what is drawn and the selection.
    await c.update({ dataSource: items(200).map((r) => ({ ...r, description: 'refreshed' })) });
    await settle();
    expect(cards()).toHaveLength(96);
    expect(cards()[60].className).toContain('is-selected');
    // Drawn to the end, no marker is left.
    for (let i = 0; i < 4; i++) {
      const last = sentinelEntry();
      if (last) await act(async () => last.fire());
      await settle();
    }
    expect(cards()).toHaveLength(200);
    expect(c.root().querySelector('.tj-ant-grow-sentinel')).toBeNull();
  });

  it('draws every card where IntersectionObserver is missing', async () => {
    window.IntersectionObserver = undefined;
    const c = await mount('antd', 'CardGrid', { dataSource: items(60) });
    expect(c.root().querySelectorAll('.tj-ant-gridcard')).toHaveLength(60);
  });
});

describe('B-02: the MUI Select menu draws at most 500 options', () => {
  const options = (n) => Array.from({ length: n }, (_, i) => ({ label: `Option ${i + 1}`, value: `v${i + 1}` }));

  it('draws the first 500, the picked one past them and a note; selectedOption is the full option', async () => {
    const c = await mount('mui', 'Select', { options: options(5000), value: 'v4999' });
    await settle();
    expect(c.exposed.selectedOption).toMatchObject({ label: 'Option 4999', value: 'v4999' });
    const trigger = c.root().querySelector('[role="combobox"]');
    expect(trigger.textContent).toContain('Option 4999');
    await act(async () => fireEvent.mouseDown(trigger, { button: 0 }));
    await settle();
    const shown = deepAll('[role="option"]');
    // 500, the picked one and the note (a disabled item).
    expect(shown).toHaveLength(502);
    expect(shown.some((o) => o.textContent === 'Option 4999' && o.getAttribute('aria-selected') === 'true')).toBe(true);
    const note = shown[shown.length - 1];
    expect(note.textContent).toBe('Showing 500 of 5000 options. An Autocomplete searches them all.');
    expect(note.getAttribute('aria-disabled')).toBe('true');
    // A pick from the drawn ones still sets the value.
    await act(async () => fireEvent.click(shown.find((o) => o.textContent === 'Option 2')));
    await settle();
    expect(c.exposed.value).toBe('v2');
    expect(c.exposed.selectedOption).toMatchObject({ label: 'Option 2', value: 'v2' });
  });

  it('draws every option and no note up to 500', async () => {
    const c = await mount('mui', 'Select', { options: options(20) });
    await act(async () => fireEvent.mouseDown(c.root().querySelector('[role="combobox"]'), { button: 0 }));
    await settle();
    expect(deepAll('[role="option"]')).toHaveLength(20);
  });
});

describe('B-03: MUI DataGrid headers keep room for their title next to the hover icons', () => {
  // 30 flex columns in a 600px grid shrank to MUI's 50px least: on hover the sort and menu buttons took the whole
  // header, the title went to 0px and a click on it opened the column menu instead of sorting.
  const gridSize = () => {
    const real = Element.prototype.getBoundingClientRect;
    stubs.push(() => (Element.prototype.getBoundingClientRect = real));
    Element.prototype.getBoundingClientRect = function () {
      if (!this.classList?.contains('MuiDataGrid-main')) return real.call(this);
      return { x: 0, y: 0, left: 0, top: 0, right: 600, bottom: 400, width: 600, height: 400, toJSON() {} };
    };
  };
  const headerWidth = (c, field) =>
    parseFloat(c.root().querySelector(`[role="columnheader"][data-field="${field}"]`).style.width);
  const cols = [
    { field: 'id', headerName: 'ID' },
    ...Array.from({ length: 29 }, (_, i) => ({ field: `c${i + 1}`, width: 40 })),
  ];

  it('a column is at least as wide as its padding, both icons and some title', async () => {
    gridSize();
    const c = await mount('mui', 'DataGrid', { rows: [{ id: 1, c1: 2 }], columns: cols });
    await waitFor(() => expect(headerWidth(c, 'id')).toBeGreaterThan(0));
    expect(headerWidth(c, 'id')).toBe(108);
    // A narrower given width is raised to the same floor.
    expect(headerWidth(c, 'c1')).toBe(108);
  });

  it('the floor drops the menu icon when the column menu is off', async () => {
    gridSize();
    const c = await mount('mui', 'DataGrid', { rows: [{ id: 1 }], columns: cols, disableColumnMenu: true });
    await waitFor(() => expect(headerWidth(c, 'id')).toBeGreaterThan(0));
    expect(headerWidth(c, 'id')).toBe(80);
  });

  // UI 2.0's Table columns: a columnSize is the column's width and the columns without one share the rest. Sized
  // columns grew in proportion to their size, so an 80px id took 210px and an unsized Subject was cut to an ellipsis.
  it('keeps a columnSize and lets unsized columns share the rest', async () => {
    gridSize();
    const ui2 = [
      { key: 'id', name: 'Ticket', columnSize: 80 },
      { key: 'subject', name: 'Subject' },
      { key: 'priority', name: 'Priority', columnType: 'badge', columnSize: 130 },
      { key: 'owner', name: 'Owner' },
    ];
    const c = await mount('mui', 'DataGrid', {
      rows: [{ id: 1, subject: 'Seat count', priority: 'High', owner: 'Ana' }],
      columns: ui2,
    });
    await waitFor(() => expect(headerWidth(c, 'subject')).toBeGreaterThan(0));
    expect(headerWidth(c, 'priority')).toBe(130);
    expect(headerWidth(c, 'id')).toBe(108);
    expect(headerWidth(c, 'subject')).toBe(headerWidth(c, 'owner'));
    expect(headerWidth(c, 'subject')).toBeGreaterThan(130);
  });
});

describe('B-04: the shadcn ScatterChart says when it samples its points', () => {
  it('samples evenly across the data, the first and last kept', () => {
    const rows = Array.from({ length: 5000 }, (_, i) => i);
    const s = evenSample(rows, 1000);
    expect(s).toHaveLength(1000);
    expect(s[0]).toBe(0);
    expect(s[999]).toBe(4999);
    expect(evenSample([1, 2, 3], 1000)).toEqual([1, 2, 3]);
    expect(sampledNote(1000, 5000, 'points')).toBe('Showing 1000 of 5000 points, sampled evenly');
    expect(sampledNote(10, 10, 'points')).toBeNull();
  });

  it('shows the note under a 5,000-point chart and none under a small one', async () => {
    const pts = Array.from({ length: 5000 }, (_, i) => ({ x: i, y: i % 97 }));
    const c = await mount('shadcn', 'ScatterChart', {
      data: pts,
      xField: 'x',
      yField: 'y',
      sizeField: '',
      groupField: '',
      nameField: '',
    });
    await settle();
    const notes = () => [...c.root().querySelectorAll('[data-chart-note]')].map((n) => n.textContent);
    expect(notes()).toContain('Showing 1000 of 5000 points, sampled evenly');
    await c.update({ data: pts.slice(0, 50) });
    await settle();
    expect(notes()).toEqual([]);
  });
});

describe('B-05: rings fit a narrow box', () => {
  it('Ant CircularProgress draws the largest square its box has room for, up to its size', async () => {
    liveObserver();
    stubLayout('clientWidth', (el) => (el.classList?.contains('tj-ant-ring-fit') ? 80 : undefined));
    stubLayout('clientHeight', (el) => (el.classList?.contains('tj-ant-ring-fit') ? 140 : undefined));
    const c = await mount('antd', 'CircularProgress', { percent: 40, size: 120 });
    await settle();
    expect(c.root().querySelector('.ant-progress-inner').style.width).toBe('80px');
  });

  it('Ant RadialChart (progress) shrinks its 120px ring to the box', async () => {
    liveObserver();
    stubLayout('clientWidth', (el) => (el.classList?.contains('tj-ant-ring-fit') ? 96 : undefined));
    stubLayout('clientHeight', (el) => (el.classList?.contains('tj-ant-ring-fit') ? 150 : undefined));
    const c = await mount('antd', 'RadialChart', { mode: 'progress', value: 50 });
    await settle();
    expect(c.root().querySelector('.ant-progress-inner').style.width).toBe('96px');
  });

  it('shadcn CircularProgress draws the largest square its box has room for, up to its size', async () => {
    liveObserver();
    stubLayout('clientWidth', (el) => (el.classList?.contains('ui2-ring-wrap') ? 70 : undefined));
    stubLayout('clientHeight', (el) => (el.classList?.contains('ui2-ring-wrap') ? 160 : undefined));
    const c = await mount('shadcn', 'CircularProgress', { value: 40 });
    await settle();
    expect(c.root().querySelector('.ui2-ring svg').getAttribute('width')).toBe('70');
  });

  it('an unlaid box keeps the size set', async () => {
    const c = await mount('shadcn', 'CircularProgress', { value: 40 });
    await settle();
    expect(c.root().querySelector('.ui2-ring svg').getAttribute('width')).toBe('96');
  });
});

describe('B-06: the MUI pie legend gives way in a narrow box', () => {
  const labels = ['Web', 'Mobile', 'Retail'];
  it.each([
    [431, 160, 'side'],
    [216, 160, 'side'],
    [108, 160, 'bottom'],
    [60, 60, 'none'],
    [0, 0, 'side'],
  ])('%ix%i: %s', (w, h, place) => {
    expect(pieLegendPlace(w, h, labels)).toBe(place);
  });

  it('a 108px PieChart lays its legend under the pie', async () => {
    liveObserver();
    stubLayout('clientWidth', (el) => (el.classList?.contains('tj-mui-chart-box') ? 108 : undefined));
    stubLayout('clientHeight', (el) => (el.classList?.contains('tj-mui-chart-box') ? 160 : undefined));
    const c = await mount('mui', 'PieChart');
    await settle();
    const legend = c.root().querySelector('.MuiChartsLegend-root');
    expect(legend).not.toBeNull();
    expect(legend.className).toMatch(/horizontal/);
  });
});

describe('B-08: the Ant Table under rapid data updates', () => {
  const tick = (n) =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Row ${i + 1}`,
      status: ['Open', 'Paid'][(n + i) % 2],
      value: n * (i + 1),
    }));
  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Status', dataIndex: 'status', format: 'tag' },
    { title: 'Value', dataIndex: 'value' },
  ];

  it('keeps the selected row highlighted in every render and its Tags in place', async () => {
    const c = await mount('antd', 'Table', { dataSource: tick(0), columns, pageSize: 20 });
    const row = (id) => c.root().querySelector(`tr[data-row-key="${id}"]`);
    fireEvent.click(row(3));
    await settle();
    expect(c.exposed.selectedRow).toMatchObject({ id: 3 });
    const tag = row(5).querySelector('.ant-tag');
    const tr = row(5);
    for (let n = 1; n <= 5; n++) {
      // The render right after new data, before the selection effect re-exposes the edited row.
      await c.update({ dataSource: tick(n) });
      expect(row(3).className).toContain('tj-ant-row-selected');
      await settle();
      expect(row(3).className).toContain('tj-ant-row-selected');
    }
    expect(c.exposed.selectedRow).toMatchObject({ id: 3, value: 15 });
    // Rows and their Tags update in place: the same nodes, the new text.
    expect(row(5)).toBe(tr);
    expect(row(5).querySelector('.ant-tag')).toBe(tag);
    expect(tag.textContent).toBe(tick(5)[4].status);
  });
});
