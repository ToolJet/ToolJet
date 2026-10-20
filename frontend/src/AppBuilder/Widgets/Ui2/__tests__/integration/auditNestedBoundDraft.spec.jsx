import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit (Codex DELAYED-AND-NESTED-OWNERSHIP-016c13d, fixture auditNestedBoundDraftAndPruning, trimmed): a List
// view in a List view's row, an Input in the inner rows. With the Input's default bound to its record
// ({{listItem.name}}), a typed draft was lost when the outer records reordered: the outer list moved its rows' values
// with their records, but not the inner lists' {{listItem}}, so the moved row first read the other record's items, the
// Input took that record's default as a new default, then its own again. The outer list now moves the inner lists'
// {{listItem}} with their records, in the same step as the values. A static default and a same-order refresh are the
// controls, a record put before it the extra case. No delayed events here.
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'outer1',
  handle: 'outer1',
  widgetWidth: 700,
  widgetHeight: 700,
  capabilities: { dnd: true },
  preload: ['ShadListView', 'ShadInput'],
});
const A = {
  id: 'A',
  children: [
    { id: 'a1', name: 'Alpha one' },
    { id: 'a2', name: 'Alpha two' },
  ],
};
const B = { id: 'B', children: [{ id: 'b1', name: 'Beta one' }] };
const C = { id: 'C', children: [{ id: 'c1', name: 'Gamma one' }] };

let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});
beforeEach(() => w.setup());
afterEach(w.teardown);

const expr = (x) => '{{' + JSON.stringify(x) + '}}';
const place = (c, parent, height) => {
  c.component.parent = parent;
  c.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
  c.layouts = { desktop: { top: 0, left: 0, width: 30, height } };
  return c;
};
const labels = () => screen.getAllByRole('textbox').map((x) => x.labels?.[0]?.textContent);
// The outer list's children: per outer row, the inner list's children, per inner row, the Input's label and value.
const published = () =>
  Object.fromEntries(
    Object.entries(w.exposed().children || {}).map(([oi, outer]) => [
      oi,
      Object.fromEntries(
        Object.entries(outer.inner1?.children || {}).map(([ii, inner]) => [
          ii,
          { label: inner.field1?.label, value: inner.field1?.value },
        ])
      ),
    ])
  );

const run = async (defaults, mode) => {
  const inner = place(
    componentDefinition('inner1', 'inner1', 'ShadListView', {
      data: binding('{{listItem.children}}'),
      idField: binding('id'),
      enablePagination: binding(false),
      itemHeight: binding(90),
    }),
    'outer1',
    230
  );
  const field = place(
    componentDefinition('field1', 'field1', 'ShadInput', {
      label: binding('{{listItem.name}}'),
      defaultValue: binding(defaults === 'static' ? 'seed' : '{{listItem.name}}'),
    }),
    'inner1',
    80
  );
  w.render({
    currentMode: 'view',
    extraComponents: { inner1: inner, field1: field },
    properties: {
      data: binding(expr([A, B])),
      idField: binding('id'),
      enablePagination: binding(false),
      itemHeight: binding(260),
    },
  });
  await waitFor(() => expect(labels()).toEqual(['Alpha one', 'Alpha two', 'Beta one']));
  const edited = mode === 'inner-remove' ? 'Alpha two' : 'Alpha one';
  const editedIndex = mode === 'inner-remove' ? 1 : 0;
  await act(async () => fireEvent.change(screen.getByLabelText(edited), { target: { value: 'Typed draft' } }));
  await waitFor(() =>
    expect({ visible: screen.getByLabelText(edited).value, published: published()[0][editedIndex].value }).toEqual({
      visible: 'Typed draft',
      published: 'Typed draft',
    })
  );
  const next =
    mode === 'same-order'
      ? [{ ...A, extra: 1 }, B]
      : mode === 'outer-reorder'
      ? [B, A]
      : mode === 'outer-prepend'
      ? [C, A, B]
      : [{ ...A, children: [A.children[1]] }, B];
  await act(async () => w.setComponentProperty('outer1', 'data', expr(next), 'properties'));
  await waitFor(() => expect(labels()).toEqual(next.flatMap((o) => o.children.map((x) => x.name))));
  await act(async () => {});
  const value = (leaf) => (leaf.name === edited ? 'Typed draft' : defaults === 'static' ? 'seed' : leaf.name);
  expect({
    visible: screen.getAllByRole('textbox').map((x) => ({ label: x.labels?.[0]?.textContent, value: x.value })),
    children: published(),
  }).toEqual({
    visible: next.flatMap((o) => o.children.map((leaf) => ({ label: leaf.name, value: value(leaf) }))),
    children: Object.fromEntries(
      next.map((outer, oi) => [
        String(oi),
        Object.fromEntries(outer.children.map((leaf, ii) => [String(ii), { label: leaf.name, value: value(leaf) }])),
      ])
    ),
  });
};

test.each([
  ['record-bound', 'same-order'],
  ['record-bound', 'outer-reorder'],
  ['record-bound', 'outer-prepend'],
  ['static', 'outer-reorder'],
])('[UI2-AUDIT-NESTDRAFT] %s default / %s keeps the typed draft and exact child membership', run);

// Core, not the pack: shortening an inner list leaves its last row in the outer list's children (key 1 kept beside
// key 0). componentSlices/listViewComponentSlice.js sizes descendant arrays at the parent path, but prunes a list's own
// children only when its exposed root is not an array, which a nested List view's is. The visible fields are right.
// Owner: core ListView state (listViewComponentSlice.js).
test.failing('[UI2-AUDIT-NESTDRAFT] static default / inner-remove keeps exact child membership (core)', () =>
  run('static', 'inner-remove')
);
