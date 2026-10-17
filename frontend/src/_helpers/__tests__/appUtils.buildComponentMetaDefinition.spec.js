// A duplicated page (or page group) comes back from the server and its components are merged with this build's
// widget defaults. A component whose type this build does not register (a widget from a newer ToolJet) has no
// defaults: it is kept exactly as the server sent it, and the known ones on the page are still merged.
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const unknown = () => ({
  component: {
    component: 'ShadKanban',
    name: 'kanban1',
    parent: null,
    definition: { properties: { title: { value: 'Board' } }, styles: {}, others: {} },
  },
  layouts: { desktop: { top: 0, left: 0, width: 8, height: 40 } },
});

const button = () => ({
  component: {
    component: 'Button',
    name: 'button1',
    definition: { properties: { text: { value: 'Save' } }, styles: {}, others: {} },
  },
  layouts: { desktop: { top: 0, left: 0, width: 4, height: 40 } },
});

describe('buildComponentMetaDefinition', () => {
  test('keeps a component of an unregistered type as sent, and still merges the known ones', () => {
    const components = buildComponentMetaDefinition({ kanban1: unknown(), btn1: button() });

    expect(components.kanban1).toEqual(unknown());
    expect(components.btn1.component.definition.properties.text).toEqual({ value: 'Save' });
    // Merged from Button's registered defaults.
    expect(components.btn1.component.definition.properties.loadingState).toBeDefined();
  });
});
