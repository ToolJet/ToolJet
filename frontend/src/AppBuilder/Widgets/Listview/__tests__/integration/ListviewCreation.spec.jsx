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
    expect(properties.serverSidePagination).toEqual({ value: '{{false}}' });
    expect(properties.totalRecords).toEqual({ value: '{{10}}' });
    expect(properties.recordVisibility).toEqual({ value: '{{true}}' });
    expect(properties.disableRecords).toEqual({ value: '{{false}}' });
    expect(properties.rowHeight).toEqual({ value: '80' });
    expect(properties.gridRecordHeight).toEqual({ value: '170' });

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

  test('[Listview-CREATE-001] a new ListView holds 8 people with a photo, name, company and role', async () => {
    // Break this catches: the old text/buttonText sample, or a record missing a field the children bind.
    const { saved } = await dropListview();

    const records = new Function(`return ${saved.component.definition.properties.data.value.slice(2, -2)}`)();
    expect(records).toHaveLength(8);
    records.forEach((record) => {
      expect(Object.keys(record).sort()).toEqual(['company', 'imageURL', 'name', 'role']);
      expect(record.imageURL).toMatch(/^https:\/\/randomuser\.me\/api\/portraits\/(men|women)\/\d+\.jpg$/);
    });
    expect(records[0]).toMatchObject({
      name: 'Henry, Arthur',
      company: 'Big Kahuna Burger Ltd.',
      role: 'Project manager',
    });
  });

  test('[Listview-CREATE-001] the default children are the Figma card: round avatar, bold name, grey company, role chip', async () => {
    // Break this catches: the old Image/Text/Button row, an avatar that is not 40px and round, or a chip that is not the Tags widget.
    const { saved, savedChildren } = await dropListview();
    const record = savedChildren.filter((child) => child.component.parent === saved.id);

    expect(record.map((child) => child.component.component)).toEqual(['Image', 'Text', 'Text', 'Tags']);
    const [avatar, name, company, role] = record;
    expect(avatar.component.definition.properties.source).toEqual({ value: '{{listItem.imageURL}}' });
    expect(avatar.component.definition.styles.borderType).toEqual({ value: 'rounded-circle' });
    expect(avatar.component.definition.styles.imageFit).toEqual({ value: 'cover' });
    expect(avatar.layouts.desktop.height).toBe(40);
    expect(name.component.definition.properties.text).toEqual({ value: '{{listItem.name}}' });
    expect(name.component.definition.styles.fontWeight).toEqual({ value: 'bold' });
    expect(company.component.definition.properties.text).toEqual({ value: '{{listItem.company}}' });
    expect(company.component.definition.styles.textColor).toEqual({ value: 'var(--cc-placeholder-text)' });
    const chips = role.component.definition.properties.data.value;
    expect(chips).toContain('listItem.role');
    expect(chips).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  test('[Listview-CREATE-001] the default children fill the 80px list record: avatar left, texts stacked, chip right', async () => {
    // Break this catches: children spilling out of the record, or a card that is not avatar | name over company | chip.
    const { saved, savedChildren } = await dropListview();
    const [avatar, name, company, role] = savedChildren
      .filter((child) => child.component.parent === saved.id)
      .map((child) => child.layouts.desktop);

    [avatar, name, company, role].forEach(({ top, height }) => {
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top + height).toBeLessThanOrEqual(80);
    });
    expect(avatar.left + avatar.width).toBeLessThanOrEqual(name.left);
    expect(name.left).toBe(company.left);
    expect(name.top + name.height).toBeLessThanOrEqual(company.top);
    expect(name.left + name.width).toBeLessThanOrEqual(role.left);
    expect(role.left + role.width).toBeLessThanOrEqual(43);
    // Centred on the same line as the avatar.
    expect(avatar.top + avatar.height / 2).toBe(40);
  });

  test('[Listview-CREATE-001] a new ListView gets a grid card tall enough for the stacked children', async () => {
    // Break this catches: a grid record that is too short for avatar, name, company and chip.
    const { saved } = await dropListview();

    expect(saved.component.definition.properties.gridRecordHeight).toEqual({ value: '170' });
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
