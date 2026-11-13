import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Long Ant Table pages and List lists draw only the rows in view (antd's virtual Table, rc-virtual-list). jsdom has no
// layout, so the boxes and row heights are stubbed per test. The pack components and the host renderer are the real ones.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK = require('../../../../../../packs/antd/src/index.ts');

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
// jsdom has no element.scrollTo.
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
  const events = [];
  const actions = new Map();
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`avr-${mounts}.js`}
      cssUrl={`avr-${mounts}.css`}
      cacheKey={`ant-virtual-rows-${name}-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={makeHost(name, {})}
      dataCy="avr-widget"
      fit={fit}
    />
  );
  const root = () => view.container.querySelector('[data-cy="avr-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  await settle();
  return { root, exposed, events, actions };
};

const many = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Person ${i + 1}`, amount: i }));
const firstNumber = (el) => Number(/Person (\d+)/.exec(el.textContent)[1]);

describe('Ant Table: long pages draw virtual', () => {
  const stubTable = () => {
    stubLayout('clientHeight', (el) => (el.classList.contains('tj-ant-table') ? 500 : undefined));
    stubLayout('clientWidth', (el) => (el.classList.contains('tj-ant-table') ? 600 : undefined));
    stubLayout('offsetHeight', (el) => (el.classList.contains('ant-table-row') ? 47 : undefined));
  };
  const props = (extra = {}) => ({
    dataSource: many(5000),
    columns: [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Amount', dataIndex: 'amount', sorter: true },
    ],
    pagination: false,
    ...extra,
  });

  it('5,000 rows draw virtual', async () => {
    stubTable();
    const t = await mount('Table', props());
    const rows = t.root().querySelectorAll('.ant-table-row');
    expect(t.root().querySelector('.ant-table-tbody-virtual')).not.toBeNull();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.length).toBeLessThanOrEqual(40);
    expect(rows[0].textContent).toContain('Person 1');
  });

  it('scrolling the body moves the window', async () => {
    stubTable();
    const t = await mount('Table', props());
    const holder = t.root().querySelector('.ant-table-tbody-virtual-holder');
    holder.scrollTop = 47 * 3000;
    fireEvent.scroll(holder);
    await settle();
    const first = t.root().querySelector('.ant-table-row');
    expect(first.textContent).not.toContain('Person 1 ');
    expect(firstNumber(first)).toBeGreaterThan(1000);
  });

  it('the selected row is drawn selected and an off-screen one stays exposed', async () => {
    stubTable();
    const t = await mount('Table', props({ rowSelection: 'checkbox' }));
    act(() => t.actions.get('selectRow')('3'));
    await settle();
    expect(t.root().querySelector('.ant-table-row.tj-ant-row-selected').textContent).toContain('Person 3');
    act(() => t.actions.get('selectRow')('4000'));
    await settle();
    expect(t.exposed.selectedRow.id).toBe(4000);
  });

  it('sorting still applies', async () => {
    stubTable();
    const t = await mount('Table', props());
    const sorter = t.root().querySelector('.ant-table-column-sorters');
    // The Amount header is the second sorter when Name sorts too; click the one inside the Amount cell.
    const amount = [...t.root().querySelectorAll('.ant-table-column-sorters')].find((s) =>
      s.textContent.includes('Amount')
    );
    expect(sorter).not.toBeNull();
    fireEvent.click(amount);
    await settle();
    fireEvent.click(amount);
    await settle();
    expect(t.root().querySelector('.ant-table-row').textContent).toContain('Person 5000');
  });

  it('pagination of 10 is not virtual', async () => {
    stubTable();
    const t = await mount('Table', props({ pagination: true, pageSize: 10 }));
    expect(t.root().querySelector('.ant-table-tbody-virtual')).toBeNull();
    expect(t.root().querySelectorAll('tr.ant-table-row')).toHaveLength(10);
  });

  it('fit draws every row', async () => {
    stubTable();
    const t = await mount('Table', props({ dataSource: many(150) }), { fit: true });
    expect(t.root().querySelector('.ant-table-tbody-virtual')).toBeNull();
    expect(t.root().querySelectorAll('tr.ant-table-row')).toHaveLength(150);
  });

  it('no layout draws every row', async () => {
    const t = await mount('Table', props({ dataSource: many(150) }));
    expect(t.root().querySelector('.ant-table-tbody-virtual')).toBeNull();
    expect(t.root().querySelectorAll('tr.ant-table-row')).toHaveLength(150);
  });
});

describe('Ant List: long lists draw virtual', () => {
  const stubList = () => {
    stubLayout('clientHeight', (el) =>
      el.classList.contains('tj-ant-list') ? 500 : el.classList.contains('rc-virtual-list-holder') ? 400 : undefined
    );
    stubLayout('offsetHeight', (el) => (el.classList.contains('ant-list-item') ? 56 : undefined));
  };
  const props = (extra = {}) => ({ dataSource: many(5000), titleField: 'name', descriptionField: '', ...extra });

  it('5,000 items draw virtual', async () => {
    stubList();
    const l = await mount('List', props());
    const items = l.root().querySelectorAll('.ant-list-item');
    expect(l.root().querySelector('.rc-virtual-list')).not.toBeNull();
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.length).toBeLessThanOrEqual(40);
    expect(l.root().querySelector('.ant-empty')).toBeNull();
  });

  it('clicking an item selects it', async () => {
    stubList();
    const l = await mount('List', props());
    fireEvent.click(l.root().querySelector('.ant-list-item'));
    await settle();
    expect(l.exposed.selectedItem.id).toBe(1);
    expect(l.root().querySelector('.ant-list-item').classList.contains('is-selected')).toBe(true);
  });

  it('Select item scrolls an off-screen item into view', async () => {
    stubList();
    const l = await mount('List', props());
    act(() => l.actions.get('selectItem')('4000'));
    await settle();
    const hit = l.root().querySelector('.tj-ant-item.is-selected');
    expect(hit).not.toBeNull();
    expect(hit.textContent).toContain('Person 4000');
  });

  it('component rows are unchanged', async () => {
    stubList();
    const l = await mount('List', props({ dataSource: many(150), renderItem: 'components' }));
    expect(l.root().querySelector('.rc-virtual-list')).toBeNull();
    expect(l.root().querySelectorAll('slot')).toHaveLength(150);
  });

  it('fit and pageSize 10 are unchanged', async () => {
    stubList();
    const fitted = await mount('List', props({ dataSource: many(150) }), { fit: true });
    expect(fitted.root().querySelectorAll('.ant-list-item')).toHaveLength(150);
    expect(fitted.root().querySelector('.rc-virtual-list')).toBeNull();
    const paged = await mount('List', props({ pageSize: 10 }));
    expect(paged.root().querySelectorAll('.ant-list-item')).toHaveLength(10);
    expect(paged.root().querySelector('.ant-list-pagination')).not.toBeNull();
    expect(paged.root().querySelector('.rc-virtual-list')).toBeNull();
  });
});
