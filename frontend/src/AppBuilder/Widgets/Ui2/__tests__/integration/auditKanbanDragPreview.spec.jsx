/**
 * UI 2.0 Kanban: a custom card's drag preview is a picture of the card, never a second live copy of its components.
 * From the Codex audit (KANBAN-DRAG-OVERLAY-OWNERSHIP, auditKanbanDragOverlayChildOwnership.spec.jsx): the preview
 * mounted the card's components again at the same card, they published their defaults over the card's edited values
 * and took over its actions, so after the drag the card's setter and a sibling button's workflow did nothing. Natively
 * (KANBAN-RESTORED-NATIVE-PREVIEW) the preview also showed the card's defaults, not what was typed on it.
 *
 * Real DndContext, KeyboardSensor and DragOverlay; real store, widgets and workflows. jsdom is given a card width.
 */
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';

const w = createWidgetHarness({
  componentType: 'ShadKanban',
  id: 'board1',
  handle: 'board1',
  widgetWidth: 900,
  widgetHeight: 500,
  capabilities: { dnd: true },
  preload: ['ShadInput', 'ShadButton'],
});

let width, host, user, alpha, card;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});
beforeEach(async () => {
  await w.setup();
  user = userEvent.setup({ delay: null });
  host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
});
afterEach(() => {
  w.teardown();
  host.remove();
});

const onCard = (component, top) => {
  component.component.parent = 'board1';
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  component.layouts = { desktop: { top, left: 0, width: 25, height: 90 } };
  return component;
};
const field = (row) => useStore.getState().getExposedValueOfComponent('input1', 'canvas', row);
const perform = async (fn, ...args) => {
  expect(fn).toBeInstanceOf(Function);
  await act(async () => fn(...args));
};

/** Two cards, Alpha and Beta, each an Input and a Button that sets it; "Alpha draft" typed on Alpha. */
const mount = async () => {
  w.render({
    currentMode: 'view',
    extraComponents: {
      input1: onCard(
        componentDefinition('input1', 'input1', 'ShadInput', {
          label: binding('{{cardData.title}}'),
          defaultValue: binding('{{cardData.value}}'),
        }),
        0
      ),
      button1: onCard(
        componentDefinition('button1', 'button1', 'ShadButton', { text: binding('{{"Apply " + cardData.title}}') }),
        100
      ),
    },
    properties: {
      data: binding(
        '{{[{id:"a",title:"Alpha",value:"alpha",status:"todo"},{id:"b",title:"Beta",value:"beta",status:"done"}]}}'
      ),
      idField: binding('id'),
      titleField: binding('title'),
      statusField: binding('status'),
      cardLayout: binding('custom'),
      cardHeight: binding('{{220}}'),
      columns: binding('{{["todo","done"]}}'),
    },
  });
  await waitFor(() => expect(screen.getAllByRole('textbox').map((box) => box.value)).toEqual(['alpha', 'beta']));
  w.setEvents([
    ...setVariableOn('input1', 'onChange', { key: 'changed', value: '{{[...(variables.changed || []),cardData.id]}}' }),
    {
      id: 'apply-sibling',
      index: 0,
      sourceId: 'button1',
      name: 'apply-sibling',
      target: 'component',
      event: {
        eventId: 'onClick',
        actionId: 'control-component',
        componentId: 'input1',
        componentSpecificActionHandle: 'setText',
        componentSpecificActionParams: [{ handle: 'text', value: 'Sibling workflow' }],
      },
    },
  ]);
  alpha = screen.getByRole('textbox', { name: 'Alpha' });
  card = alpha.closest('[aria-roledescription]');
  await act(async () => fireEvent.change(alpha, { target: { value: 'Alpha draft' } }));
  expect(field(0).value).toBe('Alpha draft');
};
// Picked up from the card itself (Space), not from a field on it.
const pickUp = async () => {
  act(() => card.focus());
  await user.keyboard(' ');
  await waitFor(() => expect(card).toHaveClass('tw-opacity-40'));
};
const cancel = async () => {
  await user.keyboard('{Escape}');
  await waitFor(() => expect(card).not.toHaveClass('tw-opacity-40'));
  expect(screen.getByRole('textbox', { name: 'Alpha' })).toBe(alpha);
};
const state = () => ({
  alpha: alpha.value,
  published: field(0)?.value,
  beta: screen.getByRole('textbox', { name: 'Beta' }).value,
  changed: w.variables().changed,
});
const expected = (value) => ({ alpha: value, published: value, beta: 'beta', changed: ['a', 'a'] });

test("picking a card up keeps its components' published values", async () => {
  await mount();
  await pickUp();
  expect({ published: field(0)?.value, changed: w.variables().changed }).toEqual({
    published: 'Alpha draft',
    changed: ['a'],
  });
  await cancel();
});

test('the preview shows what was typed on the card, and is only a picture', async () => {
  await mount();
  await pickUp();
  const copies = [...document.querySelectorAll('input')].filter((input) => input !== alpha && !host.contains(input));
  const preview = copies.find((input) => input.value === 'Alpha draft');
  expect(preview).toBeDefined();
  expect(preview.closest('[inert]')).not.toBeNull();
  expect(preview.closest('[aria-hidden="true"]')).not.toBeNull();
  // No second element by the card's ids.
  expect(preview.id).toBe('');
  expect(screen.getAllByRole('textbox')).toHaveLength(2);
  await cancel();
});

test("after a cancelled drag the card's own action still changes it", async () => {
  await mount();
  await pickUp();
  await cancel();
  await perform(field(0)?.setText, 'After cancel');
  expect(state()).toEqual(expected('After cancel'));
});

test('an action run during the drag changes the card itself', async () => {
  await mount();
  await pickUp();
  await perform(field(0)?.setText, 'During drag');
  await cancel();
  expect(state()).toEqual(expected('During drag'));
});

test.each([false, true])("the card's button sets its Input (after a drag: %s)", async (afterDrag) => {
  await mount();
  if (afterDrag) {
    await pickUp();
    await cancel();
  }
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Apply Alpha' })));
  await waitFor(() => expect(state()).toEqual(expected('Sibling workflow')));
});
