/**
 * Nothing told a builder that a custom Kanban card's components read the card's data as {{cardData.<field>}}. Card
 * content set to Custom now has a note under it in the inspector, and an empty custom card says what to put on it in
 * the editor (not in the viewer), until a component is on the card.
 * Real store, real RenderWidget, real widget; jsdom's missing layout is given a width so cards mount their canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import React from 'react';
import { render as mount, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

const ID = 'board1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['ShadText'],
});
const CUSTOM = {
  data: binding('{{[{id:1,title:"Alpha",status:"todo"}]}}'),
  idField: binding('id'),
  cardLayout: binding('custom'),
  cardHeight: binding('{{120}}'),
  columns: binding('{{["todo"]}}'),
};
const hint = () => document.querySelector('[data-empty-card-hint]');

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('UI 2.0 Kanban custom card guidance', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('an empty custom card in the editor says to bind its components to {{cardData.<field>}}', async () => {
    widget.render({ currentMode: 'edit', properties: CUSTOM });
    await waitFor(() => expect(hint()).not.toBeNull());
    expect(hint()).toHaveTextContent('{{cardData.title}}');
    expect(hint()).toHaveClass('tw-pointer-events-none');
  });

  test('not in the viewer, and not once a component is on the card', async () => {
    widget.render({ currentMode: 'view', properties: CUSTOM });
    await waitFor(() => expect(document.querySelector('[data-card-canvas]')).not.toBeNull());
    expect(hint()).toBeNull();

    const text = componentDefinition('text1', 'text1', 'ShadText', { text: binding('{{cardData.title}}') });
    text.component.parent = ID;
    text.layouts = { desktop: { top: 0, left: 0, width: 20, height: 40 } };
    widget.render({ currentMode: 'edit', properties: CUSTOM, extraComponents: { text1: text } });
    await waitFor(() => expect(document.querySelector('[data-card-canvas]')).not.toBeNull());
    expect(hint()).toBeNull();
  });

  test('Card content set to Custom has a note in the inspector; Fields has none', () => {
    const meta = componentTypeDefinitionMap.ShadKanban;
    const field = (value) => {
      const component = {
        id: ID,
        component: {
          ...meta,
          definition: { ...meta.definition, properties: { ...meta.definition.properties, cardLayout: { value } } },
        },
      };
      return mount(<>{renderElement(component, meta, () => {}, [], 'cardLayout', 'properties', {}, {}, false)}</>);
    };
    const custom = field('custom');
    expect(screen.getByText(/\{\{cardData\.<field>\}\}/)).toBeInTheDocument();
    custom.unmount();
    field('fields');
    expect(screen.queryByText(/cardData/)).toBeNull();
  });
});
