import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Team testing of the Rocket List view and Record list (2026-10-29), and the same rules in the Ant and MUI lists:
// an item's action button fired the item click too, an item with no id was keyed by its position (removing a row moved
// the selection to another record), Select item left the item's page hidden, the gap did nothing with dividers on, a
// Record list selection could not be undone, a missing title field showed another field, and an invalid currency code
// showed dollars. The pack components, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACKS = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

let mounts = 0;
const mount = async (pack, name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: PACKS[pack][name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  let current = props;
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`ltt-${mounts}.js`}
      cssUrl={`ltt-${mounts}.css`}
      cacheKey={`lists-team-1029-${pack}-${name}-${mounts}`}
      componentName={name}
      componentProps={current}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={makeHost(name, {})}
      dataCy="ltt-widget"
    />
  );
  const view = render(element());
  const root = () => view.container.querySelector('[data-cy="ltt-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  const update = (next) =>
    act(async () => {
      current = { ...current, ...next };
      view.rerender(element());
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { root, exposed, events, actions, update };
};

const seven = () => [1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: i, title: `Order ${i}`, subtitle: `Customer ${i}` }));
const abc = () => [
  { title: 'Alpha', amount: 1 },
  { title: 'Bravo', amount: 2 },
  { title: 'Charlie', amount: 3 },
];
const invoices = [
  { id: 1, title: 'Invoice A', amount: 1200 },
  { id: 2, title: 'Invoice B', amount: 340.5 },
];

let warn;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('Rocket List view', () => {
  const base = { idField: 'id', titleField: 'title', subtitleField: 'subtitle', badgeField: '', showAvatar: false };

  it("fires only the action event from an item's action button", async () => {
    const c = await mount('shadcn', 'ListView', { ...base, data: seven(), actionLabel: 'Open' });
    const button = [...c.root().querySelectorAll('.u2l-list-item button')].find((b) => b.textContent === 'Open');
    fireEvent.click(button);
    expect(c.events).toContain('onActionClicked');
    expect(c.events).not.toContain('onRecordClicked');
    expect(String(c.exposed.selectedItemId)).toBe('1');
  });

  it('keeps the selection on the same record when a row with no id is removed', async () => {
    const c = await mount('shadcn', 'ListView', { ...base, idField: '', data: abc() });
    fireEvent.click(c.root().querySelectorAll('.u2l-list-item')[1]);
    expect(c.exposed.selectedItem).toEqual(abc()[1]);
    await c.update({ data: abc().slice(1) });
    await waitFor(() => expect(c.root().querySelectorAll('.u2l-list-item')).toHaveLength(2));
    expect(c.exposed.selectedItem).toEqual(abc()[1]);
    expect(c.root().querySelectorAll('.u2l-list-item')[0].className).toContain('is-selected');
  });

  it('shows the page of an item picked by Select item, with no click event', async () => {
    const c = await mount('shadcn', 'ListView', { ...base, data: seven(), enablePagination: true, rowsPerPage: 3 });
    act(() => c.actions.get('selectItem')(6));
    await waitFor(() => expect(c.root().textContent).toContain('Order 6'));
    expect(c.root().textContent).not.toContain('Order 1');
    expect(String(c.exposed.selectedItemId)).toBe('6');
    expect(c.events).not.toContain('onRecordClicked');
  });

  it('applies the gap with dividers on plain items', async () => {
    const c = await mount('shadcn', 'ListView', { ...base, data: seven(), showBorder: true, gap: 24 });
    // Outlined cards (the default look) keep the gap between cards.
    expect(c.root().querySelector('.u2l-list-item').parentElement.style.gap).toBe('24px');
  });
});

describe.each([
  ['shadcn', '.u2l-record'],
  ['antd', '.tj-ant-item'],
  ['mui', '.tj-mui-recordlist__item .MuiListItemButton-root'],
])('%s Record list', (pack, rowSelector) => {
  const dataKey = pack === 'antd' ? 'dataSource' : 'data';
  const props = (extra = {}) => ({
    [dataKey]: invoices,
    idField: 'id',
    titleField: 'title',
    valueField: 'amount',
    valueFormat: 'currency',
    currency: 'EUR',
    ...extra,
  });
  const rows = (c) => [...c.root().querySelectorAll(rowSelector)];
  // Cleared, the shadcn list exposes a null id and Ant and MUI an empty one.
  const cleared = (c) => expect(c.exposed.selectedItemId ?? '').toBe('');

  it('unselects the selected record when it is clicked again, with no click event', async () => {
    const c = await mount(pack, 'RecordList', props());
    fireEvent.click(rows(c)[0]);
    expect(c.exposed.selectedItemId).toBe(1);
    expect(c.events.filter((e) => e === 'onItemClicked')).toHaveLength(1);
    fireEvent.click(rows(c)[0]);
    cleared(c);
    expect(c.events.filter((e) => e === 'onItemClicked')).toHaveLength(1);
  });

  it('clears the selection with clearSelection', async () => {
    const c = await mount(pack, 'RecordList', props());
    fireEvent.click(rows(c)[1]);
    expect(c.exposed.selectedItemId).toBe(2);
    act(() => c.actions.get('clearSelection')());
    cleared(c);
    expect(c.exposed.selectedItem).toEqual({});
  });

  it('shows a blank title for a title field the data lacks', async () => {
    const c = await mount(pack, 'RecordList', props({ titleField: 'name' }));
    expect(c.root().textContent).not.toContain('Invoice A');
  });

  it('formats an invalid currency code without a symbol, and warns', async () => {
    const c = await mount(pack, 'RecordList', props({ currency: 'US Dollar' }));
    expect(c.root().textContent).toContain('1,200');
    expect(c.root().textContent).not.toContain('$');
    expect(warn.mock.calls.flat().join(' ')).toContain('US Dollar');
  });

  it('keeps a row with no id selected when another row is removed', async () => {
    const c = await mount(pack, 'RecordList', props({ [dataKey]: abc(), idField: '', valueFormat: 'number' }));
    fireEvent.click(rows(c)[1]);
    expect(c.exposed.selectedItem).toEqual(abc()[1]);
    await c.update({ [dataKey]: abc().slice(1) });
    await waitFor(() => expect(rows(c)).toHaveLength(2));
    expect(c.exposed.selectedItem).toEqual(abc()[1]);
  });
});

describe.each([
  ['antd', { dataSource: seven(), rowKey: 'id', titleField: 'title', descriptionField: 'subtitle', pageSize: 3 }],
  ['mui', { items: seven(), itemKey: 'id', primaryField: 'title', secondaryField: 'subtitle', pageSize: 3 }],
])('%s List', (pack, props) => {
  it("shows the item's page, with no click event", async () => {
    const c = await mount(pack, 'List', props);
    act(() => c.actions.get('selectItem')(6));
    await waitFor(() => expect(c.root().textContent).toContain('Order 6'));
    expect(c.root().textContent).not.toContain('Order 1');
    expect(c.exposed.selectedItemKey).toBe(6);
    expect(c.events).not.toContain('onItemClick');
  });

  it('shows a blank title for a title field the data lacks', async () => {
    const title = pack === 'antd' ? 'titleField' : 'primaryField';
    const c = await mount(pack, 'List', { ...props, [title]: 'name' });
    expect(c.root().textContent).toContain('Customer 1');
    expect(c.root().textContent).not.toContain('Order 1');
  });
});
