import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit (Codex LISTVIEW-SELECTED-BACKGROUND-016c13d, a browser fixture, so this spec is new): a selected List
// view row kept its base surface when it had one (an outlined item, or a set Item background). The base was an
// inline background on the row and the selected fill a class, so the inline style won. The base is now a variable
// (--lv-item-bg) read by a class, and a row takes exactly one fill class: selected, or the base (with hover over it).
// A selected row keeps its selected fill under the pointer.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: 'lv1',
  widgetHeight: 400,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadListView'],
});

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());
beforeEach(() => w.setup());
afterEach(w.teardown);

const DATA = "{{[{ key: 'a', name: 'Ada' }, { key: 'b', name: 'Grace' }]}}";
const rows = () => screen.queryAllByRole('listitem');
// The row's background classes, by what they paint.
const fills = (row) => {
  const classes = String(row.className).split(/\s+/);
  return {
    selected: classes.some((c) => c.startsWith('tw-bg-[color:var(--lv-selected-bg')),
    base: classes.some((c) => c.startsWith('tw-bg-[color:var(--lv-item-bg')),
    hover: classes.some((c) => c.startsWith('hover:tw-bg-')),
  };
};

const VARIANTS = [
  ['plain', { itemVariant: binding('plain') }, 'transparent'],
  ['outlined', { itemVariant: binding('outline') }, 'var(--sc-card)'],
  ['explicit item background', { itemBackgroundColor: binding('#ffffff') }, '#ffffff'],
];

test.each(VARIANTS)(
  '[UI2-AUDIT-LISTSELBG-001] %s row: the selected fill is the only fill, and no inline background beats it',
  async (_name, styles, base) => {
    w.render({
      currentMode: 'view',
      properties: { data: binding(DATA), idField: binding('key') },
      styles: { selectedItemBackgroundColor: binding('#22c55e'), ...styles },
    });
    await waitFor(() => expect(rows()).toHaveLength(2));
    for (const row of rows()) {
      expect(row.style.background).toBe('');
      expect(row.style.backgroundColor).toBe('');
      expect(row.style.getPropertyValue('--lv-item-bg')).toBe(base);
      expect(fills(row)).toEqual({ selected: false, base: true, hover: true });
    }

    await act(async () => fireEvent.click(rows()[0]));
    await waitFor(() => expect(fills(rows()[0]).selected).toBe(true));
    expect(fills(rows()[0])).toEqual({ selected: true, base: false, hover: false });
    expect(rows()[0].style.background).toBe('');
    expect(fills(rows()[1])).toEqual({ selected: false, base: true, hover: true });

    // Selecting another row gives the first its base back.
    await act(async () => fireEvent.click(rows()[1]));
    await waitFor(() => expect(fills(rows()[1]).selected).toBe(true));
    expect(fills(rows()[0])).toEqual({ selected: false, base: true, hover: true });
  }
);

test('[UI2-AUDIT-LISTSELBG-002] a List view in a row starts from its own base, not its outer row one', async () => {
  // Each row sets its own --lv-item-bg: a variable on the outer row alone would reach the inner rows too. The inner
  // list has no Item background, so its rows take its own default look, the outlined card.
  const inner = componentDefinition('inner1', 'inner1', 'ShadListView', {
    data: binding('{{listItem.children}}'),
    idField: binding('id'),
    itemHeight: binding(60),
  });
  inner.component.parent = 'lv1';
  inner.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
  inner.layouts = { desktop: { top: 0, left: 0, width: 30, height: 150 } };
  const data = [
    { key: 'a', children: [{ id: 'a1' }] },
    { key: 'b', children: [{ id: 'b1' }] },
  ];
  w.render({
    currentMode: 'view',
    extraComponents: { inner1: inner },
    properties: {
      data: binding('{{' + JSON.stringify(data) + '}}'),
      idField: binding('key'),
      itemHeight: binding(180),
    },
    styles: { itemBackgroundColor: binding('#ffffff') },
  });
  await waitFor(() => expect(rows()).toHaveLength(4));
  const outer = rows().filter((row) => !row.parentElement.closest('[role="listitem"]'));
  const nested = rows().filter((row) => row.parentElement.closest('[role="listitem"]'));
  expect(outer.map((row) => row.style.getPropertyValue('--lv-item-bg'))).toEqual(['#ffffff', '#ffffff']);
  expect(nested.map((row) => row.style.getPropertyValue('--lv-item-bg'))).toEqual(['var(--sc-card)', 'var(--sc-card)']);
});
