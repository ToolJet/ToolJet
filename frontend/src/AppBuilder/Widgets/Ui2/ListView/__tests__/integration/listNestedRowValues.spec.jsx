/**
 * UI 2.0 List view in a List view row: the inner rows' component values move with their outer record. From the Codex
 * audit (NESTED-LIST-RECORD-VALUES): after the outer records were reordered or one was removed, the inner Inputs showed
 * the right values but the outer list's children kept the inner values at the old outer row. takeRowValues
 * (_shared/rowValues.ts) moved only the outer list's own row members, not a component inside the nested List view.
 */
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'list1',
  handle: 'list1',
  widgetWidth: 600,
  widgetHeight: 700,
  capabilities: { dnd: true },
  preload: ['ShadListView', 'ShadInput'],
});
const A = {
  id: 'A',
  name: 'Alpha',
  children: [
    { id: 'a1', name: 'Alpha one' },
    { id: 'a2', name: 'Alpha two' },
  ],
};
const B = {
  id: 'B',
  name: 'Beta',
  children: [
    { id: 'b1', name: 'Beta one' },
    { id: 'b2', name: 'Beta two' },
  ],
};
const C = { id: 'C', name: 'Gamma', children: [{ id: 'c1', name: 'Gamma one' }] };

let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const place = (component, parent, height) => {
  component.component.parent = parent;
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  component.layouts = { desktop: { top: 0, left: 0, width: 30, height } };
  return component;
};
/** Outer rows Alpha and Beta, each with a List view of its children (an Input per child). */
const mount = async () => {
  const inner = componentDefinition('inner1', 'inner1', 'ShadListView', {
    data: binding('{{listItem.children}}'),
    idField: binding('id'),
    enablePagination: binding('{{false}}'),
    itemHeight: binding('{{90}}'),
  });
  const field = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('seed'),
  });
  w.render({
    currentMode: 'view',
    extraComponents: { inner1: place(inner, 'list1', 220), field1: place(field, 'inner1', 80) },
    properties: {
      data: binding(`{{${JSON.stringify([A, B])}}}`),
      idField: binding('id'),
      enablePagination: binding('{{false}}'),
      itemHeight: binding('{{250}}'),
    },
  });
  await waitFor(() => expect(values()).toEqual(['seed', 'seed', 'seed', 'seed']));
  await waitFor(() => expect(published()).toEqual(['seed', 'seed', 'seed', 'seed']));
};
const values = () => screen.queryAllByRole('textbox').map((box) => box.value);
const published = () =>
  Object.values(w.exposed().children || {}).flatMap((row) =>
    Object.values(row.inner1?.children || {}).map((inner) => inner.field1?.value)
  );
const editAlphaOne = () =>
  act(async () => fireEvent.change(screen.getByLabelText('Alpha one'), { target: { value: 'Alpha edit' } }));
const setData = (data) =>
  act(async () => w.setComponentProperty('list1', 'data', `{{${JSON.stringify(data)}}}`, 'properties'));

describe('a List view in a List view row', () => {
  test('a refresh in the same order keeps the nested draft (control)', async () => {
    await mount();
    await editAlphaOne();
    await setData([{ ...A, extra: 1 }, B]);
    await waitFor(() => expect(values()).toEqual(['Alpha edit', 'seed', 'seed', 'seed']));
    expect(published()).toEqual(['Alpha edit', 'seed', 'seed', 'seed']);
  });

  test('reordered outer records take their nested values along in children', async () => {
    await mount();
    await editAlphaOne();
    await setData([B, A]);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed', 'Alpha edit', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed', 'Alpha edit', 'seed']));
  });

  test('removing an outer record does not show its nested draft under the next one', async () => {
    await mount();
    await editAlphaOne();
    await setData([B]);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed']));
  });

  test('a new record with fewer nested rows leaves no empty rows in children (control)', async () => {
    await mount();
    await editAlphaOne();
    await setData([C, B]);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed', 'seed']));
  });
});
