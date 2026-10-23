/**
 * UI 2.0 Dialog in a List view row: its values are kept per row (components[dialog][row]), so whether it is open must
 * be read from its own row. From the UI 2.0 release audit (finding 24): it read the flat entry, never saw itself open
 * and did not keep Tab inside.
 *
 * Real store, real RenderWidget, real List view, Dialog and Inputs.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { focusables } from '@/AppBuilder/Widgets/Ui2/Dialog/dialogFocus';

const widget = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'list1',
  handle: 'list1',
  capabilities: { dnd: true },
  preload: ['ShadDialog', 'ShadInput'],
  widgetHeight: 500,
  widgetWidth: 600,
});

const placed = (id, type, parent, properties, top) => {
  const component = componentDefinition(id, id, type, properties);
  component.component.parent = parent;
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
  component.layouts = { desktop: { top, left: 0, width: 20, height: 50 } };
  return component;
};

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('[finding 24] a UI 2.0 Dialog in a List view row', () => {
  beforeEach(() => {
    // ModalV2 renders into the page's canvas container.
    const host = document.createElement('div');
    host.className = 'canvas-container page-container';
    host.innerHTML = '<div class="canvas-content"><div class="tj-canvas-area real-canvas"></div></div>';
    document.body.appendChild(host);
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    document.querySelectorAll('.page-container').forEach((node) => node.remove());
  });

  test('keeps Tab inside once its row opens it', async () => {
    widget.render({
      currentMode: 'view',
      extraComponents: {
        dlg1: placed('dlg1', 'ShadDialog', 'list1', {}, 0),
        first1: placed('first1', 'ShadInput', 'dlg1', { label: binding('First field') }, 0),
        last1: placed('last1', 'ShadInput', 'dlg1', { label: binding('Last field') }, 60),
      },
      properties: { data: binding('{{[{id:1,name:"First"}]}}'), idField: binding('id') },
    });
    const dialog = () => widget.exposed().children?.[0]?.dlg1;
    await waitFor(() => expect(dialog()?.open).toBeInstanceOf(Function));
    await act(async () => dialog().open());
    await waitFor(() => expect(dialog().show).toBe(true));
    const modal = await waitFor(() => {
      const element = document.querySelector('.modal-dialog[component-id="dlg1"]')?.closest('.modal');
      expect(element).toBeInTheDocument();
      expect(focusables(element).length).toBeGreaterThanOrEqual(2);
      return element;
    });
    const controls = focusables(modal);
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    await act(async () => {
      controls[controls.length - 1].focus();
      controls[controls.length - 1].dispatchEvent(tab);
    });
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(controls[0]);
  });
});
