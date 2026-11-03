// Saved ListViews load with the config's old-look `definition`; only a new drop writes the new look.
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { addNewWidgetToTheEditor, addChildrenWidgetsToParent } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import { useGridStore } from '@/_stores/gridStore';

const MODULE_ID = 'canvas';
const PAGE_ID = 'page-1';

const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
const listviewsOnPage = () => Object.values(components()).filter((entry) => entry.component.component === 'Listview');

describe('Listview: a new drop gets the new look', () => {
  let realCanvas;

  beforeEach(() => {
    seedApp({}, { moduleId: MODULE_ID, pageId: PAGE_ID });
    realCanvas = document.createElement('div');
    realCanvas.id = 'real-canvas';
    document.body.appendChild(realCanvas);
    const dropTarget = document.createElement('div');
    document.body.appendChild(dropTarget);
    useGridStore.getState().actions.setGhostDragPosition({ e: { target: dropTarget } });
  });

  afterEach(() => {
    realCanvas.remove();
    useGridStore.getState().actions.setGhostDragPosition(null);
  });

  async function dropListview() {
    const parent = addNewWidgetToTheEditor('Listview', 'desktop', realCanvas, 'canvas');
    const children = addChildrenWidgetsToParent('Listview', parent.id, 'desktop');
    // Not awaited: without a save the returned promise never settles. The page is updated synchronously.
    useStore.getState().addComponentToCurrentPage([parent, ...children], MODULE_ID, { saveAfterAction: false });
    const saved = components()[parent.id];
    const savedChildren = children.map((child) => components()[child.id]);
    return { dropped: parent, saved, savedChildren };
  }

  test('[Listview-CREATE-001] a dropped ListView is saved with every new-look value', async () => {
    // Break this catches: the drop path writing the config's old-look definition as-is, so every
    // new ListView looks like a pre-2.0 one; or a creation value going missing or wrong.
    const { saved } = await dropListview();
    const { properties, styles } = saved.component.definition;

    expect(properties.showHeader).toEqual({ value: '{{true}}' });
    // The header height is fixed (Figma 60px), so there is no key to save.
    expect(properties.headerHeight).toBeUndefined();
    expect(properties.paginationType).toEqual({ value: 'clientSide' });
    expect(properties.totalRecords).toEqual({ value: '{{10}}' });
    expect(properties.recordVisibility).toEqual({ value: '{{true}}' });
    expect(properties.disableRecords).toEqual({ value: '{{false}}' });
    expect(properties.rowHeight).toEqual({ value: '80' });
    expect(properties.gridRecordHeight).toEqual({ value: '150' });

    // listStyle bordered is what gives the 12px container padding.
    expect(styles.listStyle).toEqual({ value: 'bordered' });
    expect(styles.gap).toEqual({ value: '{{12}}' });
    expect(styles.recordBackgroundColor).toEqual({ value: 'var(--cc-surface1-surface)' });
    expect(styles.recordDividerColor).toEqual({ value: 'var(--cc-weak-border)' });
    expect(styles.recordBorderColor).toEqual({ value: 'var(--cc-weak-border)' });
    expect(styles.recordBorderRadius).toEqual({ value: '{{6}}' });
    // No shadow is expressed by leaving the key out; the shadow field cannot parse a 'none' value.
    expect(styles.recordBoxShadow).toBeUndefined();
    expect(styles.headerBackgroundColor).toEqual({ value: 'transparent' });
    expect(styles.headerDividerColor).toEqual({ value: 'var(--cc-weak-border)' });
  });

  test('[Listview-CREATE-001] a dropped ListView holds 8 sample records and is 624px tall, so 6 show', async () => {
    // Break this catches: keeping the 3-record sample or the 450px height, so a new ListView
    // does not match Figma (6 records of 80px + 12px gaps + header, the rest scroll).
    const { saved } = await dropListview();

    const data = saved.component.definition.properties.data.value;
    const records = new Function(`return ${data.slice(2, -2)}`)();
    expect(records).toHaveLength(8);
    expect(saved.layouts.desktop.height).toBe(624);
  });

  test('[Listview-CREATE-001] the default children fit inside the 80px record', async () => {
    // Break this catches: leaving the children at their 100px-record layout (Image top 10,
    // height 80), so the Image spills out of every new record.
    const { saved, savedChildren } = await dropListview();
    const recordChildren = savedChildren.filter((child) => child.component.parent === saved.id);

    expect(recordChildren.map((child) => child.component.component)).toEqual(['Image', 'Text', 'Button']);
    for (const child of recordChildren) {
      const { top, height } = child.layouts.desktop;
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top + height).toBeLessThanOrEqual(80);
    }
  });

  test('[Listview-HDR-006] a dropped ListView gets one header Text "List view", not bound to a record', async () => {
    // Break this catches: the header Text missing, filed under the record canvas (repeated per record),
    // or bound to `listItem` like the record template and so blank.
    const { saved, savedChildren } = await dropListview();
    const headerChildren = savedChildren.filter((child) => child.component.parent === `${saved.id}-header`);

    expect(headerChildren).toHaveLength(1);
    expect(headerChildren[0].component.component).toBe('Text');
    expect(headerChildren[0].component.definition.properties.text).toEqual({ value: 'List view' });
  });

  test('[Listview-CREATE-001] the dropped ListView does not carry the creation block itself', async () => {
    // Break this catches: leaving `creationDefinition` on the component the drop builds, where any
    // consumer that keeps the whole component (not just its definition) would store it.
    const { dropped, saved } = await dropListview();

    expect(dropped.component).not.toHaveProperty('creationDefinition');
    expect(saved.component).not.toHaveProperty('creationDefinition');
  });

  test('[Listview-CREATE-001] the creation values stay out of the config defaults', async () => {
    // Break this catches: writing the new look into the config `definition` instead of at
    // creation. The server merges that definition under every saved ListView, so every old
    // ListView would change its look on the next load.
    await dropListview();
    seedApp(
      { old1: componentDefinition('old1', 'listview9', 'Listview', { data: binding('{{[]}}') }) },
      { moduleId: MODULE_ID, pageId: PAGE_ID }
    );
    const { properties, styles } = components().old1.component.definition;

    expect(styles.listStyle).toEqual({ value: 'legacy' });
    expect(properties.showHeader).toEqual({ value: '{{false}}' });
    expect(properties.rowHeight).toEqual({ value: '100' });
  });
});

describe('Listview: copy and paste keeps the saved look', () => {
  /** A ListView saved before 2.0, then merged with the config defaults as the server does on load. */
  const OLD_ID = 'lv1';

  beforeEach(() => {
    seedApp(
      {
        [OLD_ID]: componentDefinition(OLD_ID, 'listview1', 'Listview', {
          dataSourceSelector: binding('rawJson'),
          data: binding(`{{[{ n: 'a' }]}}`),
          rowHeight: binding('120'),
        }),
      },
      { moduleId: MODULE_ID, pageId: PAGE_ID }
    );
  });

  test('[Listview-CREATE-002] a pasted old ListView keeps the old look', async () => {
    // Break this catches: the paste path stamping the creation values (for example by reusing
    // the drop function), so a copy of an old ListView switches to the new look.
    const original = components()[OLD_ID];

    await pasteComponents(undefined, {
      isCut: false,
      isCloning: false,
      pageId: PAGE_ID,
      newComponents: [
        { component: original.component, layouts: original.layouts, parent: null, id: OLD_ID, events: [] },
      ],
    });

    const pasted = listviewsOnPage().find((entry) => entry.component.name !== 'listview1');
    expect(pasted).toBeDefined();
    const { properties, styles } = pasted.component.definition;
    expect(styles.listStyle).toEqual({ value: 'legacy' });
    expect(styles.gap).toEqual({ value: '{{0}}' });
    expect(properties.showHeader).toEqual({ value: '{{false}}' });
    expect(properties.rowHeight).toEqual({ value: '120' });
    expect(properties.gridRecordHeight).toBeUndefined();
    expect(styles.recordBorderColor).toBeUndefined();
    expect(styles.recordBackgroundColor).toBeUndefined();
  });
});
