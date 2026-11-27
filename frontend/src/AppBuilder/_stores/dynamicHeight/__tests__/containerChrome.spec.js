import { collapsedAccordionHeight, containerChrome } from '../containerChrome';

// The chrome is the space a container draws around its content (padding, borders, header, tab strip...): its
// height is its content plus this. Values match what the canvas draws (the old engine's getExtraContainerHeight on
// main, deleted in B4).
describe('dynamic height: container chrome', () => {
  it('[DynamicHeight-CHROME-001] gives a Container and an Accordion 20px around their content', () => {
    // 2px box padding, 1px canvas border and 7px canvas padding, top and bottom.
    expect(containerChrome('Container', {})).toBe(20);
    expect(containerChrome('Accordion', {})).toBe(20);
  });

  it('[DynamicHeight-CHROME-002] adds a shown header, with the 11px under it', () => {
    expect(containerChrome('Container', { showHeader: true, headerHeight: 60 })).toBe(91);
    expect(containerChrome('Accordion', { showHeader: true, headerHeight: 40 })).toBe(71);
    expect(containerChrome('Container', { showHeader: false, headerHeight: 60 })).toBe(20);
  });

  it('[DynamicHeight-CHROME-003] reads a header height given as text as a number', () => {
    expect(containerChrome('Container', { showHeader: true, headerHeight: '60' })).toBe(91);
    expect(containerChrome('Container', { showHeader: true, headerHeight: 'tall' })).toBe(20);
  });

  it('[DynamicHeight-CHROME-004] gives a Form its body gutter plus a shown header and footer', () => {
    expect(containerChrome('Form', {})).toBe(20);
    // header 60 + 10, footer 50 + 14
    expect(containerChrome('Form', { showHeader: true, headerHeight: 60, showFooter: true, footerHeight: 50 })).toBe(
      154
    );
  });

  it('[DynamicHeight-CHROME-005] adds nothing to a Form generated from a JSON schema, which is measured as drawn', () => {
    expect(containerChrome('Form', { showHeader: true, headerHeight: 60 }, { jsonSchemaForm: true })).toBe(0);
  });

  it('[DynamicHeight-CHROME-006] gives Tabs its tab strip and pane padding', () => {
    // 8px pane padding top and bottom, 16px canvas allowance, 50px tab strip.
    expect(containerChrome('Tabs', {})).toBe(82);
    expect(containerChrome('Tabs', { hideTabs: true })).toBe(32);
  });

  it('[DynamicHeight-CHROME-007] adds the UI 2.0 Tabs frame, and its Back/Next bar in steps mode', () => {
    expect(containerChrome('ShadTabs', {})).toBe(84);
    expect(containerChrome('ShadTabs', { variant: 'steps' })).toBe(140);
    expect(containerChrome('ShadTabs', { variant: 'steps', showStepNav: false })).toBe(84);
  });

  it('[DynamicHeight-CHROME-008] gives a modal body its padding, plus 12px per shown header and footer', () => {
    for (const type of ['ModalV2', 'ShadDialog']) {
      expect(containerChrome(type, {})).toBe(18);
      expect(containerChrome(type, { showHeader: true, showFooter: true })).toBe(42);
    }
  });

  it('[DynamicHeight-CHROME-009] gives a module root its box padding', () => {
    expect(containerChrome('ModuleContainer', {})).toBe(6);
  });

  it('[DynamicHeight-CHROME-010] keeps 8px under the lowest component of a UI 2.0 list row or Kanban card', () => {
    expect(containerChrome('ShadListView', {}, { isUi2Row: true })).toBe(8);
    expect(containerChrome('ShadKanban', {}, { isUi2Row: true })).toBe(8);
    // The widget itself, not one of its rows, draws no chrome here.
    expect(containerChrome('ShadListView', {})).toBe(0);
  });

  it('[DynamicHeight-CHROME-011] adds nothing for any other widget', () => {
    for (const type of ['Listview', 'FlexContainer', 'Text', undefined]) expect(containerChrome(type, {})).toBe(0);
    expect(containerChrome('Container')).toBe(20); // no properties resolved yet
  });

  it('[DynamicHeight-CHROME-012] draws a closed Accordion as its header alone', () => {
    // The header plus 12px: canvas padding, border and the header's own bottom border.
    expect(collapsedAccordionHeight({ showHeader: true, headerHeight: 40 })).toBe(52);
    expect(collapsedAccordionHeight({ showHeader: false, headerHeight: 40 })).toBe(0);
    expect(collapsedAccordionHeight({})).toBe(0);
  });
});
