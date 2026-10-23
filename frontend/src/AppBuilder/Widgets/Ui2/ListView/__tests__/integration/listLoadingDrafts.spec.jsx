/**
 * A List view swapped its rows for the loading look (spinner or skeleton) while loading, which unmounted every row's
 * components: what was typed in a row's Input was gone when the data came back (Codex round 7, R7-01). The rows now
 * stay mounted under the loading look, hidden and inert, and come back as they were.
 *
 * Real store, real RenderWidget, real List view rows, a real Input in the row canvas. jsdom has no layout: the List view
 * reads its width through clientWidth, given here.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const ROOT = '11111111-1111-4111-8111-111111111111';
const FIELD = '22222222-2222-4222-8222-222222222222';
let clientWidth;
beforeAll(() => {
  clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 850 });
});
afterAll(() => {
  if (clientWidth) Object.defineProperty(Element.prototype, 'clientWidth', clientWidth);
  else delete Element.prototype.clientWidth;
});

const widget = createWidgetHarness({
  componentType: 'ShadListView',
  id: ROOT,
  handle: 'list1',
  capabilities: { dnd: true },
  preload: ['ShadInput'],
  widgetWidth: 850,
  widgetHeight: 500,
});

describe('UI 2.0 List view loading', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test.each(['spinner', 'skeleton'])(
    'keeps every row’s typed draft through %s loading',
    async (loading) => {
      const field = componentDefinition(FIELD, 'field1', 'ShadInput', {
        label: binding('Draft'),
        defaultValue: binding('seed'),
      });
      field.component.parent = ROOT;
      field.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
      field.layouts = { desktop: { top: 0, left: 0, width: 35, height: 90 } };
      widget.render({
        currentMode: 'view',
        extraComponents: { [FIELD]: field },
        properties: {
          dynamicHeight: binding(false),
          loadingIndicator: binding(loading),
          data: binding('{{[{id:"a"},{id:"b"}]}}'),
          idField: binding('id'),
          rowHeight: binding(120),
        },
      });
      await waitFor(() => expect(screen.getAllByLabelText('Draft')).toHaveLength(2));
      const [first, second] = screen.getAllByLabelText('Draft');
      await act(async () => fireEvent.change(first, { target: { value: 'Alpha draft' } }));
      await act(async () => fireEvent.change(second, { target: { value: 'Beta draft' } }));

      widget.setComponentProperty(ROOT, 'loadingState', '{{true}}', 'properties');
      // Loading: the rows are still there, hidden and inert under the loading look.
      await waitFor(() => expect(document.querySelector('[role="list"]')).toHaveAttribute('aria-hidden', 'true'));
      expect(document.querySelector('[role="list"]').inert).toBe(true);
      expect(screen.getAllByLabelText('Draft', { hidden: true }).map((input) => input.value)).toEqual([
        'Alpha draft',
        'Beta draft',
      ]);

      widget.setComponentProperty(ROOT, 'loadingState', '{{false}}', 'properties');
      await waitFor(() => expect(document.querySelector('[role="list"]')).not.toHaveAttribute('aria-hidden'));
      expect(screen.getAllByLabelText('Draft').map((input) => input.value)).toEqual(['Alpha draft', 'Beta draft']);
    },
    15000
  );
});
