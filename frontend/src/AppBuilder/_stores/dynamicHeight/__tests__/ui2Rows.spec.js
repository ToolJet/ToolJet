import { ui2RowHeight } from '../ui2Rows';

// A UI 2.0 List view row and Kanban card, as the old reflow sized them (dynamicHeightReflow.resolveContainerHeight with
// isUi2RowContext): the bottom of the components on the row plus the 8px kept under them (UI2_ROW_CHROME), never
// below the Row height (72 by default) or the card height (96 by default).
const LIST = 'ShadListView';
const KANBAN = 'ShadKanban';

describe('dynamic height: one row of a UI 2.0 List view or Kanban', () => {
  it('[DynamicHeight-UI2ROW-001] fits its components plus the space kept under them', () => {
    expect(ui2RowHeight({ componentType: LIST, properties: {}, contentBottom: 160 })).toBe(168);
    expect(ui2RowHeight({ componentType: KANBAN, properties: {}, contentBottom: 160 })).toBe(168);
  });

  it('[DynamicHeight-UI2ROW-002] never goes below the Row height or card height', () => {
    expect(ui2RowHeight({ componentType: LIST, properties: {}, contentBottom: 30 })).toBe(72);
    expect(ui2RowHeight({ componentType: LIST, properties: { rowHeight: 200 }, contentBottom: 150 })).toBe(200);
    expect(ui2RowHeight({ componentType: KANBAN, properties: {}, contentBottom: 30 })).toBe(96);
    expect(ui2RowHeight({ componentType: KANBAN, properties: { cardHeight: 150 }, contentBottom: 100 })).toBe(150);
    // An empty row is the Row height.
    expect(ui2RowHeight({ componentType: LIST, properties: {}, contentBottom: 0 })).toBe(72);
  });

  it('[DynamicHeight-UI2ROW-003] keeps the Row height or card height with Dynamic height off', () => {
    expect(ui2RowHeight({ componentType: LIST, properties: { dynamicHeight: false }, contentBottom: 300 })).toBe(72);
    expect(ui2RowHeight({ componentType: KANBAN, properties: { dynamicHeight: false }, contentBottom: 300 })).toBe(96);
  });

  it('[DynamicHeight-UI2ROW-004] lets a card with a component hidden on it go below its card height, to 40 at least', () => {
    // A component shown on some cards only (from cardData) leaves the cards that hide it shorter.
    expect(ui2RowHeight({ componentType: KANBAN, properties: {}, contentBottom: 60, anyHidden: true })).toBe(68);
    expect(ui2RowHeight({ componentType: KANBAN, properties: {}, contentBottom: 0, anyHidden: true })).toBe(40);
    // Still never taller than its components need: with nothing hidden it is floored at the card height.
    expect(ui2RowHeight({ componentType: KANBAN, properties: {}, contentBottom: 60, anyHidden: false })).toBe(96);
  });
});
