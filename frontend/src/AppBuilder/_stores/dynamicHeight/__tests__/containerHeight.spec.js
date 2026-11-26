import { getContentSlotId, resolveContainerHeight } from '../containerHeight';
import { heightContractOf } from '../contracts';

// The content a container would measure, as the engine hands it over. Each getter records that it was asked, so a
// spec can show that content which does not decide the height is never measured.
const contentOf = ({
  gridBottom = 0,
  rowHeights = [],
  fallbackRowHeight = 0,
  flexHeight = 0,
  jsonSchemaHeight = 0,
}) => {
  const asked = [];
  const ask = (name, value) => () => {
    asked.push(name);
    return value;
  };
  return {
    asked,
    content: {
      gridBottom: ask('gridBottom', gridBottom),
      rows: ask('rows', { rowHeights, fallbackRowHeight }),
      flexHeight: ask('flexHeight', flexHeight),
      jsonSchemaHeight: ask('jsonSchemaHeight', jsonSchemaHeight),
    },
  };
};

const heightOf = ({ componentType, properties = {}, savedHeight = 300, content = {}, ...state }) =>
  resolveContainerHeight({ componentType, properties, savedHeight, content: contentOf(content).content, ...state });

describe('dynamic height: the canvas a container lays its content on', () => {
  const slotOf = (componentType, properties = {}, currentTab) =>
    getContentSlotId({ componentId: 'box', contract: heightContractOf(componentType), properties, currentTab });

  it('[DynamicHeight-SLOT-001] is its own canvas for every container but Tabs', () => {
    for (const type of ['Container', 'Form', 'Accordion', 'ModalV2', 'ModuleContainer']) {
      expect(slotOf(type)).toBe('box');
    }
  });

  it('[DynamicHeight-SLOT-002] is the active tab for Tabs and the UI 2.0 Tabs', () => {
    expect(slotOf('Tabs', { defaultTab: 't1' }, 't2')).toBe('box-t2');
    expect(slotOf('ShadTabs', {}, 't3')).toBe('box-t3');
  });

  it('[DynamicHeight-SLOT-003] falls back to the default tab, then the first visible tab, before a tab is picked', () => {
    const tabItems = [
      { id: 't1', visible: false },
      { id: 't2', visible: true },
    ];
    expect(slotOf('Tabs', { defaultTab: 't1', tabItems })).toBe('box-t1');
    expect(slotOf('Tabs', { tabItems })).toBe('box-t2');
    // Every tab hidden: the first one. Older Tabs keep the list under `tabs`.
    expect(slotOf('Tabs', { tabs: [{ id: 'a', visible: false }] })).toBe('box-a');
    // Tab ids can be numbers, 0 included.
    expect(slotOf('Tabs', {}, 0)).toBe('box-0');
  });

  it('[DynamicHeight-SLOT-005] uses the default tab while the Tabs reports no tab yet', () => {
    // Until a Tabs mounts, its exposed currentTab is the registered default '' (tabs.js exposedVariables).
    expect(slotOf('Tabs', { defaultTab: 't1' }, '')).toBe('box-t1');
    expect(slotOf('Tabs', { tabItems: [{ id: 't2' }] }, null)).toBe('box-t2');
  });

  it('[DynamicHeight-SLOT-004] is the Tabs canvas itself when it has no tabs', () => {
    expect(slotOf('Tabs', {})).toBe('box');
  });
});

describe('dynamic height: container height', () => {
  it('[DynamicHeight-CONTAINER-001] fits its content plus its chrome', () => {
    // 400 of content plus a Container's 20px of chrome.
    expect(heightOf({ componentType: 'Container', content: { gridBottom: 400 } })).toBe(420);
    expect(heightOf({ componentType: 'Tabs', content: { gridBottom: 400 } })).toBe(482);
  });

  it('[DynamicHeight-CONTAINER-002] never goes below the height it was drawn at', () => {
    expect(heightOf({ componentType: 'Container', savedHeight: 300, content: { gridBottom: 100 } })).toBe(300);
  });

  it('[DynamicHeight-CONTAINER-003] keeps its drawn height with Dynamic height off, without measuring its content', () => {
    const { content, asked } = contentOf({ gridBottom: 900 });
    const height = resolveContainerHeight({
      componentType: 'Container',
      properties: { dynamicHeight: false },
      savedHeight: 300,
      content,
    });
    expect(height).toBe(300);
    expect(asked).toEqual([]);
  });

  it('[DynamicHeight-CONTAINER-004] keeps its drawn height while hidden, without measuring its content', () => {
    const { content, asked } = contentOf({ gridBottom: 900 });
    expect(resolveContainerHeight({ componentType: 'Form', savedHeight: 300, visible: false, content })).toBe(300);
    expect(asked).toEqual([]);
  });

  it('[DynamicHeight-CONTAINER-005] still sizes a modal whose trigger is hidden, since it can be opened from code', () => {
    // A modal's Visibility is its trigger button's; its 18px of body chrome is added to the content.
    expect(heightOf({ componentType: 'ModalV2', visible: false, content: { gridBottom: 400 } })).toBe(418);
  });

  it('[DynamicHeight-CONTAINER-006] draws a closed Accordion as its header, Dynamic height on or off', () => {
    const header = { showHeader: true, headerHeight: 40 };
    for (const dynamicHeight of [true, false]) {
      const properties = { ...header, dynamicHeight };
      expect(heightOf({ componentType: 'Accordion', properties, isExpanded: false })).toBe(52);
    }
    // Hidden and closed, it takes no space.
    expect(heightOf({ componentType: 'Accordion', properties: header, isExpanded: false, visible: false })).toBe(0);
  });

  it('[DynamicHeight-CONTAINER-007] keeps an open Accordion at its drawn height with Dynamic height off', () => {
    const height = heightOf({
      componentType: 'Accordion',
      properties: { dynamicHeight: false },
      isExpanded: true,
      content: { gridBottom: 900 },
    });
    expect(height).toBe(300);
    // Open with Dynamic height on: it fits its content.
    expect(
      heightOf({ componentType: 'Accordion', properties: { dynamicHeight: true }, content: { gridBottom: 400 } })
    ).toBe(420);
  });

  it('[DynamicHeight-CONTAINER-008] fits a module root to its content both ways when the module has Dynamic height', () => {
    // 6px of module chrome; no floor at the drawn 300.
    const root = (dynamicHeight) =>
      heightOf({ componentType: 'ModuleContainer', properties: { dynamicHeight }, content: { gridBottom: 100 } });
    expect(root(true)).toBe(106);
    expect(root(undefined)).toBe(300);
  });

  it('[DynamicHeight-CONTAINER-009] sizes a Form generated from a JSON schema by the schema as drawn', () => {
    const { content, asked } = contentOf({ gridBottom: 900, jsonSchemaHeight: 450 });
    const height = resolveContainerHeight({
      componentType: 'Form',
      properties: { showHeader: true, headerHeight: 60 },
      savedHeight: 300,
      jsonSchemaForm: true,
      content,
    });
    expect(height).toBe(450);
    expect(asked).toEqual(['jsonSchemaHeight']);
  });

  it('[DynamicHeight-CONTAINER-010] stacks a List view by its rows, never below its drawn height', () => {
    // rows 150 + 90 + 320 and 18px of chrome
    const rows = { rowHeights: [150, 90, 320], fallbackRowHeight: 0 };
    expect(heightOf({ componentType: 'Listview', savedHeight: 300, content: rows })).toBe(578);
    expect(
      heightOf({ componentType: 'Listview', savedHeight: 300, content: { rowHeights: [40], fallbackRowHeight: 0 } })
    ).toBe(300);
  });

  it('[DynamicHeight-CONTAINER-011] lets a List view inside an outer row go below its drawn height', () => {
    const rows = { rowHeights: [40], fallbackRowHeight: 0 };
    expect(heightOf({ componentType: 'Listview', savedHeight: 300, isNestedInRow: true, content: rows })).toBe(58);
  });

  it('[DynamicHeight-CONTAINER-012] keeps a List view at its drawn height with Dynamic height off', () => {
    const rows = { rowHeights: [150, 90, 320], fallbackRowHeight: 0 };
    expect(
      heightOf({ componentType: 'Listview', properties: { dynamicHeight: false }, savedHeight: 300, content: rows })
    ).toBe(300);
  });

  it('[DynamicHeight-CONTAINER-013] sizes a hidden List view from its rows, as on main', () => {
    // The List view is sized before visibility is checked, unlike the grid containers.
    const rows = { rowHeights: [150, 90, 320], fallbackRowHeight: 0 };
    expect(heightOf({ componentType: 'Listview', savedHeight: 300, visible: false, content: rows })).toBe(578);
  });

  it('[DynamicHeight-CONTAINER-014] takes a FlexContainer at the height its flex layout gives', () => {
    // resolveFlexContainerHeight applies its own chrome and floor.
    expect(heightOf({ componentType: 'FlexContainer', content: { flexHeight: 120 } })).toBe(120);
  });

  it('[DynamicHeight-CONTAINER-015] never holds a FlexContainer card or row at its drawn height', () => {
    // A card or a UI 2.0 row always fits its content (dynamicHeightPolicy.heightHeldInView).
    const card = { dynamicHeight: false, cardStyle: 'shadcnCard', layoutVersion: '2' };
    expect(heightOf({ componentType: 'FlexContainer', properties: card, content: { flexHeight: 120 } })).toBe(120);
    const column = { dynamicHeight: false, direction: 'column', layoutVersion: '2' };
    expect(heightOf({ componentType: 'FlexContainer', properties: column, content: { flexHeight: 120 } })).toBe(300);
  });

  it('[DynamicHeight-CONTAINER-016] measures only the content its kind lays out', () => {
    const measured = (componentType, properties = {}) => {
      const { content, asked } = contentOf({});
      resolveContainerHeight({ componentType, properties, savedHeight: 0, content });
      return asked;
    };
    expect(measured('Container')).toEqual(['gridBottom']);
    expect(measured('Listview')).toEqual(['rows']);
    expect(measured('FlexContainer')).toEqual(['flexHeight']);
  });

  it('[DynamicHeight-CONTAINER-017] keeps the drawn height of a widget that is not a container', () => {
    expect(heightOf({ componentType: 'Text', content: { gridBottom: 900 } })).toBe(300);
  });
});
