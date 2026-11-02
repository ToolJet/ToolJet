/**
 * Inspector preview resolution for components that a List View stores once per row.
 * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (D-14).
 */
import useStore from '@/AppBuilder/_stores/store';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';

const PAGE_ID = 'page-1';

const seedRowChild = () => {
  useStore.setState((state) => {
    state.modules.canvas.currentPageId = PAGE_ID;
    state.modules.canvas.currentPageIndex = 0;
    state.modules.canvas.pages = [
      { id: PAGE_ID, components: { t1: { component: { name: 'text1', component: 'Text', parent: 'lv1' } } } },
    ];
    state.modules.canvas.componentNameIdMapping = { text1: 't1' };
    state.resolvedStore.modules.canvas.exposedValues.components = { t1: [{ text: 'r0' }, { text: 'r1' }] };
  });
};

const preview = (code, scope) => resolveReferences(code, undefined, scope);

describe('Inspector preview of a component stored per row', () => {
  beforeEach(seedRowChild);

  test('[Listview-BUG-054] outside a row the preview matches the canvas, not row 1', () => {
    // Break this catches: every editor flattening per-row arrays to row 1, so an editor outside the
    // list previews a value the canvas never shows (D-14).
    expect(preview('{{components.text1.text}}', {})[2]).toBeUndefined();
  });

  test('[Listview-BUG-054] inside a row the preview still shows row 1', () => {
    // Break this catches: a fix that drops the row-1 preview for editors that are inside the row.
    expect(preview('{{components.text1.text}}', { listItem: { name: 'a' } })[2]).toBe('r0');
  });
});

describe('Inspector preview inside a nested list', () => {
  test('[Listview-BUG-055] a nested row scope previews a value, not a SyntaxError', () => {
    // Break this catches: the editor passing a nested list's row group (an array) as its scope, whose
    // numeric keys become parameter names and make every expression a SyntaxError.
    const firstOuterRowGroup = [{ listItem: { name: 'a' } }, { listItem: { name: 'b' } }];

    const [, error, value] = preview('{{listItem.name}}', firstOuterRowGroup);

    expect(error).toBeFalsy();
    expect(value).toBe('a');
  });
});
