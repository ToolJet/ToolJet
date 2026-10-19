// Found by a keyboard end-user test (19 Oct): a List view row matched :focus-visible but showed no ring. The row's
// inline style always set box-shadow (none when no item shadow was chosen), and the focus and selected rings were
// Tailwind rings, which are box-shadows, so the inline style hid both. The indicators are now outlines, which an item
// shadow does not cover, and the row sets box-shadow only for a chosen shadow.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: 'lv1',
  widgetHeight: 400,
  widgetWidth: 600,
  capabilities: { dnd: true },
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
// Tailwind rings are box-shadows; an indicator drawn that way is hidden by the row's inline box-shadow.
const ringClasses = (row) =>
  String(row.className)
    .split(/\s+/)
    .filter((c) => /(^|:)tw-ring-/.test(c));

test('[UI2-AUDIT-LISTFOCUS-001] with no item shadow, a row sets no box-shadow and its focus mark is an outline', async () => {
  w.render({ currentMode: 'view', properties: { data: binding(DATA), idField: binding('key') } });
  await waitFor(() => expect(rows()).toHaveLength(2));
  expect(rows()[0].style.boxShadow).toBe('');
  expect(ringClasses(rows()[0])).toEqual([]);
  expect(rows()[0].className).toMatch(/focus-visible:tw-outline/);
});

test('[UI2-AUDIT-LISTFOCUS-002] a chosen item shadow stays, and the selected row is still marked', async () => {
  w.render({
    currentMode: 'view',
    properties: { data: binding(DATA), idField: binding('key') },
    styles: { itemShadow: binding('md') },
  });
  await waitFor(() => expect(rows()).toHaveLength(2));
  await act(async () => fireEvent.click(rows()[1]));
  await waitFor(() => expect(rows()[1].getAttribute('aria-selected') ?? rows()[1].className).toBeTruthy());
  expect(rows()[1].style.boxShadow).not.toBe('');
  expect(ringClasses(rows()[1])).toEqual([]);
  expect(rows()[1].className).toMatch(/(^|\s)tw-outline(\s|$)/);
});
