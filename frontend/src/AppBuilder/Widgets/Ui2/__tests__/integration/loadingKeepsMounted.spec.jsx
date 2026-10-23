import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
/**
 * Loading must not unmount what the user is working in. A List view (R7-01) and a Dialog swapped their canvases for
 * the loading look, and the components in them lost what had been typed; this covers every widget that hosts child
 * canvases and every input, from the configs, so a new one is covered when it is added:
 *  - a container (a type the canvas lets widgets be dropped into) keeps a child Input's node and typed draft;
 *  - a widget holding user input (an exposed value and a change event) keeps its own control's node, and the draft typed in a text control,
 * through loading and back, with the spinner and with the skeleton where the widget offers both.
 *
 * Real store, real RenderWidget, real child canvases. jsdom has no layout: the List view and Kanban read their width
 * through clientWidth, given here.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { DROPPABLE_PARENTS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import {
  CONFIGS,
  HOLDS_INPUT_TYPES,
  TYPES,
  addPageCanvas,
  defaultsOf,
} from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

let clientWidth;
beforeAll(() => {
  clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 850 });
});
afterAll(() => {
  if (clientWidth) Object.defineProperty(Element.prototype, 'clientWidth', clientWidth);
  else delete Element.prototype.clientWidth;
});

const ID = '11111111-1111-4111-8111-111111111111';
const CHILD = '22222222-2222-4222-8222-222222222222';

// How a child goes into each container's canvas: the canvas id, properties that show it, and how to open it.
const CANVAS = {
  ShadListView: { parent: ID, properties: { data: binding('{{[{id:"a"}]}}'), idField: binding('id') } },
  ShadTabs: { parent: `${ID}-${defaultsOf('ShadTabs').tabs[0].id}` },
  ShadKanban: { parent: ID, properties: { cardLayout: binding('custom') } },
  ShadDialog: { parent: ID, open: 'open', page: true },
};
const CONTAINERS = TYPES.filter((type) => DROPPABLE_PARENTS.has(type));

// The looks a widget can load with: spinner and skeleton where it offers the choice, else its one look.
const indicators = (type) => (CONFIGS[type].properties?.loadingIndicator ? ['spinner', 'skeleton'] : [undefined]);
const cases = (types) => types.flatMap((type) => indicators(type).map((look) => [type, look ?? 'its own look']));
const lookProps = (look) => (look === 'spinner' || look === 'skeleton' ? { loadingIndicator: binding(look) } : {});

const handleOf = (type) => `${type.replace(/^Shad/, '').toLowerCase()}1`;
const harnessFor = (type) =>
  createWidgetHarness({
    componentType: type,
    id: ID,
    handle: handleOf(type),
    capabilities: { dnd: true },
    preload: ['ShadInput'],
    widgetWidth: 850,
    widgetHeight: 500,
  });

const TEXT =
  'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([readonly]), textarea';
const CONTROL = `${TEXT}, [role=checkbox], [role=switch], [role=slider], [role=radio], [role=combobox], button, input`;

/** Loads, checks `node` is still in the page, stops loading, and checks it again. */
const throughLoading = async (widget, node) => {
  await widget.act('setLoading', true);
  await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
  expect(node.isConnected).toBe(true);
  await widget.act('setLoading', false);
  await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
  expect(node.isConnected).toBe(true);
};

describe('UI 2.0 loading keeps what the user is working in', () => {
  it('knows how to put a child in every container', () => {
    expect(CONTAINERS.length).toBeGreaterThan(0);
    expect(CONTAINERS.filter((type) => !CANVAS[type])).toEqual([]);
  });

  it.each(cases(CONTAINERS))(
    '%s keeps a child Input and its draft through loading (%s)',
    async (type, look) => {
      const widget = harnessFor(type);
      const how = CANVAS[type];
      const removeCanvas = how.page ? addPageCanvas() : () => {};
      await widget.setup();
      try {
        const child = componentDefinition(CHILD, 'field1', 'ShadInput', { label: binding('Draft') });
        child.component.parent = how.parent;
        child.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
        child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 70 } };
        widget.render({
          currentMode: 'view',
          extraComponents: { [CHILD]: child },
          properties: { dynamicHeight: binding(false), ...how.properties, ...lookProps(look) },
        });
        if (how.open) await widget.act(how.open);
        const input = (await screen.findAllByLabelText('Draft'))[0];
        await act(async () => fireEvent.change(input, { target: { value: 'unsaved draft' } }));
        await throughLoading(widget, input);
        expect(screen.getAllByLabelText('Draft')[0]).toBe(input);
        expect(input).toHaveValue('unsaved draft');
      } finally {
        widget.teardown();
        removeCanvas();
      }
    },
    15000
  );

  it.each(cases(HOLDS_INPUT_TYPES))(
    '%s keeps its control and draft through loading (%s)',
    async (type, look) => {
      const widget = harnessFor(type);
      await widget.setup();
      try {
        widget.render({ currentMode: 'view', properties: lookProps(look) });
        const root = await waitFor(() => {
          // The widget's own root (the pack's popup root is a .tj-shadcn too).
          const el = document.querySelector(`[data-cy="draggable-widget-${handleOf(type)}"] .tj-shadcn`);
          expect(el?.querySelector(CONTROL)).toBeTruthy();
          return el;
        });
        const text = root.querySelector(TEXT);
        const control = text || root.querySelector(CONTROL);
        if (text) await act(async () => fireEvent.change(text, { target: { value: '42' } }));
        const typed = text?.value;
        await throughLoading(widget, control);
        if (text) expect(control.value).toBe(typed);
      } finally {
        widget.teardown();
      }
    },
    15000
  );
});
