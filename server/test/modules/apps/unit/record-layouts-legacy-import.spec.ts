/**
 * An old-format export carries components inside the definition, and import gives each a new id while it walks them.
 * A ListView's `properties.recordLayouts` is keyed by child id, so its keys must follow, including children that
 * come after the ListView in the walk.
 */
import { transformComponentData } from 'src/modules/apps/services/app-import-export.service';

const box = (left: number) => ({ top: 10, left, width: 6, height: 30 });
const LAYOUTS = { desktop: box(1), mobile: box(1) };

const page = () => ({
  lv: {
    layouts: LAYOUTS,
    component: {
      name: 'listview1',
      component: 'Listview',
      definition: {
        properties: { recordLayouts: { value: { list: { txt: box(2), gone: box(3) }, grid: { txt: box(4) } } } },
        styles: {},
        general: {},
        validation: {},
        generalStyles: {},
        others: {},
        events: [],
      },
    },
  },
  txt: {
    parent: 'lv',
    layouts: LAYOUTS,
    component: {
      name: 'text1',
      component: 'Text',
      definition: {
        properties: {},
        styles: {},
        general: {},
        validation: {},
        generalStyles: {},
        others: {},
        events: [],
      },
    },
  },
});

describe('old-format import of a ListView layout memory', () => {
  it('[Listview-GRID-016] re-keys the memory to the new child ids, also for a child later in the walk', () => {
    const mapping: Record<string, string> = {};

    const [listview, text] = transformComponentData(page(), [], mapping, false, '3.0.0');

    expect(text.id).toBe(mapping.txt);
    expect(listview.properties.recordLayouts.value).toEqual({
      list: { [text.id]: box(2) },
      grid: { [text.id]: box(4) },
    });
  });
});
