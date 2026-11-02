/**
 * Autocomplete for components and row variables inside List View rows.
 * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (D-14, Listview-BUG-054..056).
 */
import useStore from '@/AppBuilder/_stores/store';

const PAGE_ID = 'page-1';
const OUTER = '11111111-0000-4000-8000-000000000001';
const ROW_TEXT = '11111111-0000-4000-8000-000000000002';
const INNER = '11111111-0000-4000-8000-000000000003';
const INNER_TEXT = '11111111-0000-4000-8000-000000000004';

const definition = (name, type, parent) => ({ component: { name, component: type, parent } });

const seed = () => {
  useStore.setState((state) => {
    state.modules.canvas.currentPageId = PAGE_ID;
    state.modules.canvas.currentPageIndex = 0;
    state.modules.canvas.pages = [
      {
        id: PAGE_ID,
        components: {
          [OUTER]: definition('listview1', 'Listview'),
          [ROW_TEXT]: definition('text1', 'Text', OUTER),
          [INNER]: definition('listview2', 'Listview', OUTER),
          [INNER_TEXT]: definition('text2', 'Text', INNER),
        },
      },
    ];
    state.modules.canvas.componentNameIdMapping = {
      listview1: OUTER,
      text1: ROW_TEXT,
      listview2: INNER,
      text2: INNER_TEXT,
    };
    state.containerChildrenMapping = { canvas: [OUTER], [OUTER]: [ROW_TEXT, INNER], [INNER]: [INNER_TEXT] };
    state.resolvedStore.modules.canvas.exposedValues.components = { [ROW_TEXT]: [{ text: 'r0' }, { text: 'r1' }] };
    state.resolvedStore.modules.canvas.customResolvables = {
      [OUTER]: [{ listItem: { 'First Name': 'Ann', tags: ['x'] } }],
      [INNER]: { 0: [{ listItem: { name: 'a' } }, { listItem: { name: 'b' } }] },
    };
  });
};

const hintNames = (hints) => hints.map((entry) => entry.hint);

describe('Autocomplete for components stored per row', () => {
  beforeEach(seed);

  test('[Listview-BUG-054] outside a row, a row child offers no fields the canvas cannot read', () => {
    // Break this catches: global hints unwrapping a per-row array to row 1, so an editor outside the
    // list is offered `components.text1.text`, which resolves to nothing there (D-14).
    useStore.getState().rebuildComponentHints('canvas');

    const global = hintNames(useStore.getState().suggestions.segments.components);

    expect(global).toContain('components.text1');
    expect(global).not.toContain('components.text1.text');
  });

  test('[Listview-BUG-054] inside the row, the sibling s fields are still offered', () => {
    // Break this catches: a fix that removes the row-scoped sibling hints too.
    expect(hintNames(useStore.getState().getContextHints(INNER, 'canvas'))).toContain('components.text1.text');
  });

  test('[Listview-BUG-055] a nested row offers its own listItem fields', () => {
    // Break this catches: the hint builder reading a nested list's row group (an array) as one row,
    // so no `listItem` hints appear inside a nested list.
    expect(hintNames(useStore.getState().getContextHints(INNER_TEXT, 'canvas'))).toContain('listItem.name');
  });
});

describe('Autocomplete inserts valid code', () => {
  beforeEach(seed);

  test('[Listview-BUG-056] a key with a space and an array index become bracket accessors', () => {
    // Break this catches: every key joined with a dot, so accepting `listItem.First Name` or
    // `listItem.tags.0` inserts code that does not parse.
    const hints = hintNames(useStore.getState().getContextHints(ROW_TEXT, 'canvas'));

    expect(hints).toContain('listItem["First Name"]');
    expect(hints).toContain('listItem.tags');
    expect(hints).not.toContain('listItem.First Name');
  });
});
