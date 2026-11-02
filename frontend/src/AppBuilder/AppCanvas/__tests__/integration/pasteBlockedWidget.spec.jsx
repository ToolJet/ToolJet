/**
 * Pasting into a row-scoped parent, through the real `pasteComponents`.
 *
 * A List View row refuses widgets like Kanban. The refusal is per component, so a refused
 * component's children were still created and kept a parent id that no longer existed — invisible
 * on the canvas, invisible in the Inspector, and saved in the app.
 *
 * Lives here rather than under Widgets/Listview because the code is the shared copy-paste path;
 * the List View is only where it surfaces. Titles carry the Listview scenario ID so the contract
 * validator can link them.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';

const MODULE_ID = 'canvas';
const PAGE_ID = 'page-1';
const LIST_ID = 'lv1';
const KANBAN_ID = 'kan1';

function child(id, name, type, parent, properties = {}) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = parent;
  return definition;
}

/** The clipboard shape copyComponents produces: the selection, then every descendant. */
function clipboardForKanban(components) {
  const entry = (id) => ({
    component: components[id].component,
    layouts: components[id].layouts,
    parent: components[id].component.parent,
    id,
    events: [],
  });
  return {
    isCut: false,
    isCloning: false,
    pageId: PAGE_ID,
    newComponents: [entry(KANBAN_ID), entry('card1'), entry('card2')],
  };
}

const componentIds = () => Object.keys(useStore.getState().getCurrentPageComponents(MODULE_ID));

const orphans = () => {
  const components = useStore.getState().getCurrentPageComponents(MODULE_ID);
  return Object.entries(components)
    .filter(([, value]) => {
      const parent = value.component.parent;
      if (!parent) return false;
      const base = useStore.getState().getBaseParentId(parent);
      return !components[base];
    })
    .map(([id]) => id);
};

describe('Paste into a List View row', () => {
  beforeEach(() => {
    seedApp(
      {
        [LIST_ID]: componentDefinition(LIST_ID, 'listview1', 'Listview', {
          dataSourceSelector: binding('rawJson'),
          data: binding(`{{[{ n: 'a' }]}}`),
        }),
        [KANBAN_ID]: componentDefinition(KANBAN_ID, 'kanban1', 'Kanban', {}),
        card1: child('card1', 'text2', 'Text', KANBAN_ID, { text: binding('one') }),
        card2: child('card2', 'text3', 'Text', KANBAN_ID, { text: binding('two') }),
        cont1: componentDefinition('cont1', 'container1', 'Container', {}),
        inner1: child('inner1', 'text4', 'Text', 'cont1', { text: binding('three') }),
      },
      { moduleId: MODULE_ID, pageId: PAGE_ID }
    );
  });

  test('[Listview-BUG-014] a refused Kanban leaves none of its children behind', async () => {
    // Break this catches: filtering each pasted component on its own. The Kanban is refused, its
    // children are not, so they land pointing at a parent that was never created.
    const before = componentIds();
    const clipboard = clipboardForKanban(useStore.getState().getCurrentPageComponents(MODULE_ID));

    await pasteComponents(LIST_ID, clipboard);

    expect(orphans()).toEqual([]);
    expect(componentIds()).toEqual(before);
  });

  test('[Listview-BUG-014] an allowed Container still arrives with its child', async () => {
    // Break this catches: a cascade that drops anything whose parent is not itself pasted, which
    // would also throw away a component dropped straight onto the target parent.
    const components = useStore.getState().getCurrentPageComponents(MODULE_ID);
    const entry = (id) => ({
      component: components[id].component,
      layouts: components[id].layouts,
      parent: components[id].component.parent,
      id,
      events: [],
    });

    await pasteComponents(LIST_ID, {
      isCut: false,
      isCloning: false,
      pageId: PAGE_ID,
      newComponents: [entry('cont1'), entry('inner1')],
    });

    expect(orphans()).toEqual([]);
    const added = componentIds().filter((id) => !['lv1', 'kan1', 'card1', 'card2', 'cont1', 'inner1'].includes(id));
    expect(added).toHaveLength(2);
  });
});
