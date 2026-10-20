import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 Kanban: a key typed in a control on a custom card belongs to that control, not to the card. From the Codex
 * audit (KANBAN-NATIVE-WORD-ENTRY, KANBAN-RESTORED-PREVIEW, auditKanbanNestedSpace.spec.jsx): the card passed every
 * keydown from inside it to dnd-kit's keyboard sensor, so Space typed in an Input on the card picked the card up to
 * move instead of inserting a space, and Space on a Button on the card started a drag instead of running its workflow.
 * The card's own keys (Space picks it up, Enter opens it) still work when the card itself has focus.
 *
 * Real DndContext and KeyboardSensor; real store, widgets and workflows. jsdom is given a card width.
 */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadKanban',
  id: 'board1',
  handle: 'board1',
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['ShadInput', 'ShadButton'],
});

let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => Object.defineProperty(Element.prototype, 'clientWidth', width));
beforeEach(() => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
  return w.setup();
});
afterEach(() => {
  w.teardown();
  document.querySelectorAll('.canvas-content').forEach((n) => n.remove());
});

const child = (type, name, props, top) => {
  const c = componentDefinition(name, name, type, props);
  c.component.parent = 'board1';
  c.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  c.layouts = { desktop: { top, left: 0, width: 20, height: 70 } };
  return c;
};

const mount = async () => {
  w.render({
    currentMode: 'view',
    extraComponents: {
      input1: child('ShadInput', 'input1', { defaultValue: binding('alpha') }, 0),
      button1: child('ShadButton', 'button1', { text: binding('Update Alpha') }, 100),
    },
    properties: {
      data: binding('{{[{id:1,title:"Alpha",status:"todo"}]}}'),
      idField: binding('id'),
      titleField: binding('title'),
      statusField: binding('status'),
      cardLayout: binding('custom'),
      cardHeight: binding('{{200}}'),
      columns: binding('{{["todo","done"]}}'),
    },
  });
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('alpha'));
  await act(async () =>
    w.setEvents([
      {
        id: 'update',
        index: 0,
        sourceId: 'button1',
        name: 'update',
        target: 'component',
        event: {
          eventId: 'onClick',
          actionId: 'control-component',
          componentId: 'input1',
          componentSpecificActionHandle: 'setText',
          componentSpecificActionParams: [{ handle: 'text', value: 'updated' }],
        },
      },
    ])
  );
};

// The live draggable card around the Input (a drag preview would be a picture, not a second canvas).
const card = () =>
  screen
    .getAllByRole('textbox')
    .map((input) => input.closest('[aria-roledescription]'))
    .find(Boolean);
const dragging = () => card().classList.contains('tw-opacity-40');
const caretAtEnd = (input) =>
  act(() => {
    input.focus();
    input.setSelectionRange(5, 5);
  });

test('Space in an Input on the card inserts a space rather than picking the card up', async () => {
  await mount();
  const user = userEvent.setup({ delay: null });
  const input = screen.getByRole('textbox');
  caretAtEnd(input);
  await user.keyboard(' ');
  const observed = { text: input.value, dragging: dragging(), focused: document.activeElement === input };
  await user.keyboard('{Escape}');
  expect(observed).toEqual({ text: 'alpha ', dragging: false, focused: true });
});

test('Space on a Button on the card runs its workflow, not a card drag', async () => {
  await mount();
  const user = userEvent.setup({ delay: null });
  act(() => screen.getByRole('button', { name: 'Update Alpha' }).focus());
  await user.keyboard(' ');
  const observed = { text: screen.getAllByRole('textbox')[0].value, dragging: dragging() };
  await user.keyboard('{Escape}');
  expect(observed).toEqual({ text: 'updated', dragging: false });
});

test('Space on the card itself still picks it up; Escape cancels without changing the draft', async () => {
  await mount();
  const user = userEvent.setup({ delay: null });
  act(() => card().focus());
  await user.keyboard(' ');
  await waitFor(() => expect(card()).toHaveClass('tw-opacity-40'));
  await user.keyboard('{Escape}');
  await waitFor(() => expect(card()).not.toHaveClass('tw-opacity-40'));
  expect(screen.getByRole('textbox')).toHaveValue('alpha');
});

test('letters still edit the Input without starting a drag', async () => {
  await mount();
  const user = userEvent.setup({ delay: null });
  const input = screen.getByRole('textbox');
  caretAtEnd(input);
  await user.keyboard('x');
  expect(input).toHaveValue('alphax');
  expect(card()).not.toHaveClass('tw-opacity-40');
});

test('Enter still runs the Button workflow without starting a drag', async () => {
  await mount();
  const user = userEvent.setup({ delay: null });
  act(() => screen.getByRole('button', { name: 'Update Alpha' }).focus());
  await user.keyboard('{Enter}');
  expect(screen.getByRole('textbox')).toHaveValue('updated');
  expect(card()).not.toHaveClass('tw-opacity-40');
});

test('Space edits the Input when card dragging is off', async () => {
  await mount();
  await act(async () => w.setComponentProperty('board1', 'allowDrag', '{{false}}', 'properties'));
  const user = userEvent.setup({ delay: null });
  const input = screen.getByRole('textbox');
  caretAtEnd(input);
  await user.keyboard(' ');
  expect(input).toHaveValue('alpha ');
  expect(card()).not.toHaveClass('tw-opacity-40');
});
