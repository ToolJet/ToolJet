/**
 * What the UI 2.0 widgets share to match the native widgets (_shared/parity.ts, textActions.ts, keyboard.ts).
 *
 * Release audit (17 Oct):
 *  - 5: a run-time override (setText, setImageURL...) came back after its property moved on and returned: text A,
 *    setText('Manual'), bound B, bound A showed 'Manual' again. The native setters drop the override once the
 *    property changes.
 *  - 14: whether a widget is clickable was read from every module's events, so a handler in another module on the
 *    same component id made a canvas Text a focusable button.
 *  - 15: Text, Heading and Breadcrumb act as buttons when clicks are wired but ignored Space (the button pattern
 *    takes Enter and Space; Icon already did).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, store, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const harnesses = {};
const harnessFor = (componentType) =>
  (harnesses[componentType] ??= createWidgetHarness({
    componentType,
    handle: 'widget1',
    id: ID,
    widgetHeight: 120,
    widgetWidth: 420,
    preload: [componentType],
  }));

// [componentType, property, action, exposed value that shows it]
const OVERRIDES = [
  ['ShadText', 'text', 'setText', 'text'],
  ['ShadHeading', 'text', 'setText', 'text'],
  ['ShadButton', 'text', 'setText', 'buttonText'],
  ['ShadLink', 'linkText', 'setLinkText', 'linkText'],
  ['ShadImage', 'source', 'setImageURL', 'imageURL'],
];
OVERRIDES.forEach(([type]) => harnessFor(type));

describe('[UI2-PARITY-005] a run-time override ends when its property changes', () => {
  it.each(OVERRIDES)('%s.%s', async (componentType, property, action, exposedKey) => {
    const widget = harnessFor(componentType);
    await widget.setup();
    try {
      const A = property === 'source' ? 'https://example.com/a.png' : 'Alpha';
      const B = property === 'source' ? 'https://example.com/b.png' : 'Beta';
      const manual = property === 'source' ? 'https://example.com/manual.png' : 'Manual';
      widget.render({ currentMode: 'view', properties: { [property]: binding(A) } });
      await waitFor(() => expect(widget.exposed()?.[exposedKey]).toBe(A));
      await widget.act(action, manual);
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(manual));
      widget.setComponentProperty(ID, property, B, 'properties');
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(B));
      widget.setComponentProperty(ID, property, A, 'properties');
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(A));
      // A later override still works.
      await widget.act(action, manual);
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(manual));
    } finally {
      widget.teardown();
    }
  });
});

describe('[UI2-PARITY-014] clickable is read from the widget’s own module', () => {
  it('an onClick in another module leaves an unwired canvas Text plain', async () => {
    const widget = harnessFor('ShadText');
    await widget.setup();
    try {
      widget.render({ currentMode: 'view', properties: { text: binding('Unwired text') } });
      await screen.findByText('Unwired text');
      await act(async () => {
        store().initializeEventsSlice('another-module');
        store().eventsSlice.setEvents(setVariableOn(ID, 'onClick'), 'another-module');
      });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      // The control: the same handler on the canvas makes it a button.
      await act(async () => widget.setEvents(setVariableOn(ID, 'onClick')));
      expect(await screen.findByRole('button')).toHaveTextContent('Unwired text');
    } finally {
      widget.teardown();
    }
  });
});

// [componentType, event, properties]
const BUTTONS = [
  ['ShadText', 'onClick', { text: 'Action' }],
  ['ShadHeading', 'onClick', { text: 'Action' }],
  ['ShadBreadcrumb', 'onItemClicked', { items: '{{[{ title: "Action" }]}}' }],
  ['ShadIcon', 'onClick', { icon: 'ArrowRight' }],
];
BUTTONS.forEach(([type]) => harnessFor(type));

describe('[UI2-PARITY-015] a widget acting as a button takes Enter and Space, once each', () => {
  it.each(
    BUTTONS.flatMap(([type, event, props]) =>
      ['Enter', ' '].map((key) => [type, JSON.stringify(key), event, props, key])
    )
  )('%s %s', async (componentType, _label, event, properties, key) => {
    const widget = harnessFor(componentType);
    await widget.setup();
    try {
      widget.render({
        currentMode: 'view',
        properties: Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
      });
      await act(async () => widget.setEvents(setVariableOn(ID, event, { value: '{{(variables.seen || 0) + 1}}' })));
      const button = await screen.findByRole('button');
      await act(async () => {
        button.focus();
        fireEvent.keyDown(button, { key, code: key === ' ' ? 'Space' : 'Enter' });
        fireEvent.keyUp(button, { key, code: key === ' ' ? 'Space' : 'Enter' });
      });
      await waitFor(() => expect(widget.variables().seen).toBe(1));
    } finally {
      widget.teardown();
    }
  });
});
