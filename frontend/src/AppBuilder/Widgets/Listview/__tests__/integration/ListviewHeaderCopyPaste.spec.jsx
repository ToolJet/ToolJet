/**
 * Copy, paste and delete of a ListView that has header components (Listview-HDR-009), through the real
 * `copyComponents`, `pasteComponents` and `deleteComponents`. Store only: the paths are slot-agnostic
 * in the UI, so what matters is where each header component is filed afterwards.
 */
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { copyComponents, pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const MODULE_ID = 'canvas';
const PAGE_ID = 'page-1';
const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';
const HEADER = `${LV}-header`;

function child(id, name, type, parent, properties) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = parent;
  return definition;
}

const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
const textOf = (component) => component.component.definition.properties.text.value;

describe('Listview header: copy-paste and delete', () => {
  let clipboard;

  beforeEach(() => {
    clipboard = null;
    Object.assign(navigator, { clipboard: { writeText: jest.fn((value) => (clipboard = value)) } });
    seedApp(
      {
        [LV]: componentDefinition(LV, 'listview1', 'Listview', {
          dataSourceSelector: binding('rawJson'),
          data: binding(`{{[{ n: 'a' }]}}`),
          showHeader: binding('{{true}}'),
        }),
        rec1: child('rec1', 'text1', 'Text', LV, { text: binding('{{listItem.n}}') }),
        hdr1: child('hdr1', 'title1', 'Text', HEADER, { text: binding('Title') }),
      },
      { moduleId: MODULE_ID, pageId: PAGE_ID }
    );
    useStore.getState().setSelectedComponents([LV]);
  });

  afterEach(() => {
    useStore.getState().clearSelectedComponents();
    jest.clearAllMocks();
  });

  test('[Listview-HDR-009] a pasted ListView keeps its header Text under its own new header slot', async () => {
    // Break this catches: paste leaving the header Text under the old ListView's slot, or filing it on
    // the canvas or under the bare new id, so the copy shows no header or steals the original's.
    copyComponents({ isCut: false, isCloning: false });
    expect(JSON.parse(clipboard).newComponents).toHaveLength(3);
    const before = new Set(Object.keys(components()));

    await pasteComponents(undefined, JSON.parse(clipboard));

    const added = Object.entries(components()).filter(([id]) => !before.has(id));
    const newLv = added.find(([, entry]) => entry.component.component === 'Listview')[0];
    const headerTexts = added.filter(([, entry]) => entry.component.parent === `${newLv}-header`);
    expect(added).toHaveLength(3);
    expect(newLv).not.toBe(LV);
    expect(headerTexts).toHaveLength(1);
    expect(textOf(headerTexts[0][1])).toBe('Title');
    expect(components().hdr1.component.parent).toBe(HEADER);
    expect(added.filter(([, entry]) => entry.component.parent === newLv)).toHaveLength(1);
  });

  test('[Listview-HDR-009] deleting a ListView removes its header components from the store', () => {
    // Break this catches: delete walking only direct children, so header Texts stay behind as orphans
    // filed under a ListView that no longer exists.
    useStore.getState().deleteComponents([LV], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true });

    expect(Object.keys(components())).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
