/**
 * UI 2.0 List view: which record a row's component values belong to, after the data or the page changes. From the
 * UI 2.0 release audit (findings 10, 27, 28, 29, 67); each test names its finding. Rows hold an Input whose default is
 * the item's name, so a row's exposed value tells which record it was drawn for.
 *
 * Real store, real RenderWidget, real widgets; jsdom's missing layout is given a width so rows mount their canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'list1';
const widget = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadInput'],
});

const ALPHA = { id: 'a', name: 'Alpha' };
const BETA = { id: 'b', name: 'Beta' };
const json = (records) => `{{${JSON.stringify(records)}}}`;

/** An Input per row, labelled and defaulted with the row's name. */
const field = () => {
  const child = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('{{listItem.name}}'),
  });
  child.component.parent = ID;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 90 } };
  return child;
};

const exposed = () => widget.exposed() ?? {};
/** The Input values the store holds per row, in row order. */
const published = () => Object.values(exposed().children ?? {}).map((row) => row.field1?.value);
const boxes = () => screen.queryAllByRole('textbox');

const render = async (records, properties = {}) => {
  widget.render({
    currentMode: 'view',
    extraComponents: { field1: field() },
    properties: { data: binding(json(records)), idField: binding('id'), ...properties },
  });
  await waitFor(() => expect(published()).toHaveLength(records.length));
};

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('UI 2.0 List view row identity', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[finding 10] data refreshed to nothing leaves no rows in children', async () => {
    await render([ALPHA, BETA]);
    widget.setComponentProperty(ID, 'data', '{{[]}}', 'properties');
    await waitFor(() => expect(boxes()).toHaveLength(0));
    expect(exposed().data).toEqual([]);
    await waitFor(() => expect(Object.keys(exposed().children ?? {})).toHaveLength(0));
  });
});
