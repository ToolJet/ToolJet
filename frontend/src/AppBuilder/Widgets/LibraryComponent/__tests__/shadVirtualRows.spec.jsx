import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Rocket 2.0 DataTable and List view draw only the rows in view once a page holds more than 100 (as ToolJet 1.0's
// Table does). Jsdom has no layout, so the box and row heights are stubbed.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK = require('../../../../../../packs/shadcn/src/index.ts');

// Layout stubs: jsdom has no layout. offset* live on HTMLElement.prototype; client*, scroll* on Element.prototype.
const stubs = [];
const stubLayout = (prop, pick) => {
  const proto = prop.startsWith('offset') ? HTMLElement.prototype : Element.prototype;
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
// jsdom has no element.scrollTo (tanstack scrollToIndex calls it).
const realScrollTo = Element.prototype.scrollTo;
beforeEach(() => {
  Element.prototype.scrollTo = function scrollTo({ top }) {
    this.scrollTop = top;
    this.dispatchEvent(new Event('scroll'));
  };
});
afterEach(() => {
  while (stubs.length) stubs.pop()();
  Element.prototype.scrollTo = realScrollTo;
  document.body.innerHTML = '';
});
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));

let mounts = 0;
const mount = async (name, props, { fit = false } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: PACK[name] });
  mounts += 1;
  const exposed = {};
  const actions = new Map();
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`virt-${mounts}.js`}
      cssUrl={`virt-${mounts}.css`}
      cacheKey={`shad-virtual-${name}-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={actions}
      host={makeHost(name, {})}
      fit={fit}
      dataCy="virt-widget"
    />
  );
  const root = () => view.container.querySelector('[data-cy="virt-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  return { root, exposed, actions };
};

const many = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Person ${i + 1}`, amount: i }));

describe('shadcn DataTable virtual rows', () => {
  const columns = [{ key: 'name', name: 'Name' }];
  const tableStubs = () => {
    stubLayout('clientHeight', (el) => (el.classList?.contains('t2-box') ? 400 : undefined));
    stubLayout('offsetHeight', (el) =>
      el.classList?.contains('t2-box')
        ? 400
        : el.tagName === 'TR' && el.parentElement?.tagName === 'TBODY' && !el.classList.contains('t2-plain')
          ? 44
          : undefined
    );
  };
  const dataRows = (root) => root().querySelectorAll('tbody tr:not(.t2-plain)');
  const scrollTo = async (root, top) => {
    const box = root().querySelector('.t2-box');
    box.scrollTop = top;
    fireEvent.scroll(box);
    await settle();
  };
  const base = { columns, enablePagination: false };

  test('5,000 rows in a 400px box draw only the rows in view', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, data: many(5000) });
    const count = dataRows(root).length;
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThan(40);
    expect(root().textContent).toContain('5000 rows');
    expect(root().querySelector('table').getAttribute('aria-rowcount')).toBe('5001');
    expect(dataRows(root)[0].getAttribute('aria-rowindex')).toBe('2');
  });

  test('scrolling moves the window', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, data: many(5000) });
    await scrollTo(root, 44 * 2500);
    expect(dataRows(root)[0].textContent).toMatch(/Person 24\d\d|Person 25\d\d/);
    expect(dataRows(root).length).toBeLessThan(40);
    const first = root().querySelector('tbody tr');
    expect(first.classList.contains('t2-plain')).toBe(true);
    expect(parseFloat(first.querySelector('td').style.height)).toBeGreaterThan(0);
  });

  test('an off-screen row selected by action stays selected and exposed', async () => {
    tableStubs();
    const { root, exposed, actions } = await mount('DataTable', { ...base, data: many(5000) });
    act(() => actions.get('selectRow')('id', 4000));
    await settle();
    expect(exposed.selectedRow.id).toBe(4000);
    expect(dataRows(root).length).toBeLessThan(40);
    await scrollTo(root, 44 * 3999);
    const selected = root().querySelector('tbody tr[data-state="selected"]');
    expect(selected).not.toBeNull();
    expect(selected.textContent).toContain('Person 4000');
  });

  test('stripes follow the row, not the window', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, tableType: 'striped', data: many(5000) });
    // The window then starts on an odd row, so a window-position stripe would flip.
    await scrollTo(root, 44 * 1000);
    const rows = [...dataRows(root)];
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((tr) => {
      const odd = (Number(tr.getAttribute('aria-rowindex')) - 2) % 2 === 1;
      expect(tr.classList.contains('is-striped')).toBe(odd);
    });
  });

  test('Dynamic height (fit) draws every row', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, data: many(150) }, { fit: true });
    expect(dataRows(root)).toHaveLength(150);
    expect(root().querySelector('table').hasAttribute('aria-rowcount')).toBe(false);
  });

  test('with no layout every row is drawn', async () => {
    const { root } = await mount('DataTable', { ...base, data: many(150) });
    expect(dataRows(root)).toHaveLength(150);
  });

  test('100 rows or fewer are unchanged', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, data: many(100) });
    expect(dataRows(root)).toHaveLength(100);
    expect(root().querySelector('table').hasAttribute('aria-rowcount')).toBe(false);
    expect(root().querySelector('tbody tr.t2-plain')).toBeNull();
  });

  test('a page of 10 is unchanged', async () => {
    tableStubs();
    const { root } = await mount('DataTable', { ...base, enablePagination: true, rowsPerPage: 10, data: many(5000) });
    expect(dataRows(root)).toHaveLength(10);
  });
});

describe('shadcn ListView virtual rows', () => {
  const listStubs = () => {
    stubLayout('clientHeight', (el) => (el.classList?.contains('u2l-list-items') ? 400 : undefined));
    // scrollToIndex clamps to scrollHeight - clientHeight.
    stubLayout('scrollHeight', (el) => (el.classList?.contains('u2l-list-items') ? 64 * 5000 : undefined));
    stubLayout('offsetHeight', (el) =>
      el.classList?.contains('u2l-list-items') ? 400 : el.classList?.contains('u2l-list-item') ? 64 : undefined
    );
  };
  const items = (root) => root().querySelectorAll('.u2l-list-item');
  const props = { data: many(5000), titleField: 'name' };

  test('5,000 field items draw only those in view', async () => {
    listStubs();
    const { root } = await mount('ListView', props);
    expect(items(root).length).toBeGreaterThanOrEqual(3);
    expect(items(root).length).toBeLessThan(40);
    expect(items(root)[0].getAttribute('aria-setsize')).toBe('5000');
    expect(items(root)[0].getAttribute('aria-posinset')).toBe('1');
  });

  test('Select item scrolls an off-screen item into view', async () => {
    listStubs();
    const { root, exposed, actions } = await mount('ListView', props);
    act(() => actions.get('selectItem')(4000));
    await settle();
    expect(items(root).length).toBeLessThan(40);
    const selected = root().querySelector('.u2l-list-item.is-selected');
    expect(selected).not.toBeNull();
    expect(selected.textContent).toContain('Person 4000');
    expect(exposed.selectedItem.id).toBe(4000);
  });

  test('the room around the window is spacer items, not padding on the scroll box', async () => {
    // A box is never shorter than its own vertical padding: with about 400,000px of padding the scroll box grew to the
    // whole list and drew every item (real Chrome, 5,000 items).
    listStubs();
    const { root, actions } = await mount('ListView', props);
    const box = () => root().querySelector('.u2l-list-items');
    expect(box().style.paddingTop).toBe('');
    expect(box().style.paddingBottom).toBe('');
    const spacers = () => [...box().querySelectorAll(':scope > [aria-hidden="true"]')];
    expect(spacers()).toHaveLength(1);
    expect(parseInt(spacers()[0].style.height, 10)).toBeGreaterThan(100000);
    act(() => actions.get('selectItem')(4000));
    await settle();
    expect(spacers()).toHaveLength(2);
  });

  test('fit draws every item', async () => {
    listStubs();
    const { root } = await mount('ListView', { ...props, data: many(150) }, { fit: true });
    expect(items(root)).toHaveLength(150);
  });

  test('grid and component rows are unchanged', async () => {
    listStubs();
    const grid = await mount('ListView', { ...props, data: many(150), mode: 'grid' });
    expect(items(grid.root)).toHaveLength(150);
    const rows = await mount('ListView', { ...props, data: many(150), itemContent: 'components' });
    expect(rows.root().querySelectorAll('.u2l-list-items slot')).toHaveLength(150);
  });

  test('with no layout every item is drawn', async () => {
    const { root } = await mount('ListView', { ...props, data: many(150) });
    expect(items(root)).toHaveLength(150);
  });
});
