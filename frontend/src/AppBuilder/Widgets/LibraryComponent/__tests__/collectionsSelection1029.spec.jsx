import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Selections outside the lists (team testing, 2026-10-29): a Kanban, Card grid, Progress list or Timeline selection
// could not be undone, and a Kanban card or Timeline item kept as selected after it left the data. The pack
// components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
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
const mount = async (pack, name, props, ready) => {
  loadLibraryModule.mockResolvedValue({ [name]: PACKS[pack][name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  let current = props;
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`cs-${mounts}.js`}
      cssUrl={`cs-${mounts}.css`}
      cacheKey={`collections-1029-${pack}-${name}-${mounts}`}
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
      dataCy="cs-widget"
    />
  );
  const view = render(element());
  const root = () => view.container.querySelector('[data-cy="cs-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelectorAll(ready).length).toBeGreaterThan(0));
  await waitFor(() => expect(actions.has('clearSelection')).toBe(true));
  const update = (next) =>
    act(async () => {
      current = { ...current, ...next };
      view.rerender(element());
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { root, exposed, events, actions, update };
};
const isEmpty = (v) => v === undefined || v === null || v === '' || (typeof v === 'object' && !Object.keys(v).length);

const CARDS = [
  { title: 'Load 1', status: 'todo' },
  { title: 'Load 2', status: 'todo' },
  { title: 'Load 3', status: 'doing' },
];
const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
];

describe.each([
  ['shadcn', 'data'],
  ['antd', 'dataSource'],
  ['mui', 'data'],
])('%s Kanban', (pack, dataName) => {
  const cards = (c) => [...c.root().querySelectorAll('[data-kb-card]')];
  const byTitle = (c, title) => cards(c).find((el) => el.textContent.includes(title));
  const board = () => mount(pack, 'Kanban', { [dataName]: CARDS, columns: COLUMNS }, '[data-kb-card]');

  it('unselects a card clicked again, with no event, and clears with clearSelection', async () => {
    const c = await board();
    fireEvent.click(byTitle(c, 'Load 2'));
    expect(c.exposed.lastSelectedCard).toMatchObject({ title: 'Load 2' });
    expect(c.events.filter((e) => e === 'onCardSelected')).toHaveLength(1);
    fireEvent.click(byTitle(c, 'Load 2'));
    expect(isEmpty(c.exposed.lastSelectedCard)).toBe(true);
    expect(c.events.filter((e) => e === 'onCardSelected')).toHaveLength(1);
    fireEvent.click(byTitle(c, 'Load 3'));
    act(() => c.actions.get('clearSelection')());
    expect(isEmpty(c.exposed.lastSelectedCard)).toBe(true);
  });

  it('keeps a card with no id selected when another is removed, and clears it when it leaves', async () => {
    const c = await board();
    fireEvent.click(byTitle(c, 'Load 2'));
    await c.update({ [dataName]: CARDS.slice(1) });
    await waitFor(() => expect(cards(c)).toHaveLength(2));
    expect(byTitle(c, 'Load 2').className).toContain('is-selected');
    expect(byTitle(c, 'Load 3').className).not.toContain('is-selected');
    await c.update({ [dataName]: CARDS.slice(2) });
    await waitFor(() => expect(cards(c)).toHaveLength(1));
    expect(isEmpty(c.exposed.lastSelectedCard)).toBe(true);
  });
});

const ROWS = [
  { id: 1, title: 'North', name: 'North', value: 40 },
  { id: 2, title: 'South', name: 'South', value: 70 },
];

describe.each([
  ['shadcn', 'CardGrid', 'data', '.u2l-card', 'onCardClicked', true],
  ['antd', 'CardGrid', 'dataSource', '.tj-ant-gridcard', 'onCardClicked', true],
  ['mui', 'CardGrid', 'dataSource', '.MuiCardActionArea-root', 'onCardClicked', true],
  ['shadcn', 'ProgressList', 'data', '.ui2-plist-row', 'onItemClicked', false],
  ['antd', 'ProgressList', 'dataSource', '.tj-ant-progress-row', 'onItemClicked', true],
  ['mui', 'ProgressList', 'data', '.tj-mui-progresslist__item .MuiListItemButton-root', 'onItemClicked', true],
])('%s %s', (pack, name, dataName, selector, event, toggles) => {
  const props = { [dataName]: ROWS, idField: 'id', titleField: 'title', labelField: 'name', valueField: 'value' };
  const rows = (c) => [...c.root().querySelectorAll(selector)];

  it('clears the selection with clearSelection', async () => {
    const c = await mount(pack, name, props, selector);
    fireEvent.click(rows(c)[1]);
    expect(String(c.exposed.selectedItemId)).toBe('2');
    act(() => c.actions.get('clearSelection')());
    expect(isEmpty(c.exposed.selectedItemId)).toBe(true);
    expect(isEmpty(c.exposed.selectedItem)).toBe(true);
  });

  it(toggles ? 'unselects the selected item when clicked again' : 'selects again on a second click (no highlight)', async () => {
    const c = await mount(pack, name, props, selector);
    fireEvent.click(rows(c)[0]);
    fireEvent.click(rows(c)[0]);
    if (toggles) {
      expect(isEmpty(c.exposed.selectedItemId)).toBe(true);
      expect(c.events.filter((e) => e === event)).toHaveLength(1);
    } else expect(String(c.exposed.selectedItemId)).toBe('1');
  });
});

describe.each([
  ['shadcn', '.n2-timeline-item'],
  ['mui', '.tj-mui-timeline__item, [class*="timeline"] li'],
])('%s Timeline', (pack, selector) => {
  const items = [
    { title: 'Ordered', time: '2026-10-01' },
    { title: 'Packed', time: '2026-10-02' },
    { title: 'Shipped', time: '2026-10-03' },
  ];
  const rows = (c) => [...c.root().querySelectorAll(selector)];

  it('follows a selected item that moved, clears one that left, and clears with clearSelection', async () => {
    const c = await mount(pack, 'Timeline', { items }, selector);
    fireEvent.click(rows(c).find((el) => el.textContent.includes('Packed')));
    expect(c.exposed.selectedItem).toMatchObject({ title: 'Packed' });
    await c.update({ items: items.slice(1) });
    expect(c.exposed.selectedItem).toMatchObject({ title: 'Packed' });
    await c.update({ items: items.slice(2) });
    expect(isEmpty(c.exposed.selectedItem)).toBe(true);
    fireEvent.click(rows(c)[0]);
    expect(c.exposed.selectedItem).toMatchObject({ title: 'Shipped' });
    act(() => c.actions.get('clearSelection')());
    expect(isEmpty(c.exposed.selectedItem)).toBe(true);
  });
});
