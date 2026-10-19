/**
 * UI 2.0 Kanban: a custom card's drag preview leaves its Checkbox, Switch and Number input alone. From the Codex
 * audit (KANBAN-DRAG-OVERLAY-OWNERSHIP, auditKanbanOverlayFieldMatrix.spec.jsx): the preview's live copies published
 * their defaults (a required checked Checkbox turned invalid) and took over the fields' actions, after both a
 * cancelled drag and a drop in the same place.
 *
 * DndContext is the real one, wrapped only to count the drag callbacks its sensors deliver.
 */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';

let mockDelivery;
jest.mock('@dnd-kit/core', () => {
  const real = jest.requireActual('@dnd-kit/core');
  const R = jest.requireActual('react');
  return {
    ...real,
    DndContext: function CountedContext(props) {
      return R.createElement(real.DndContext, {
        ...props,
        onDragStart: (event) => {
          mockDelivery.started++;
          props.onDragStart?.(event);
        },
        onDragCancel: (event) => {
          mockDelivery.cancelled++;
          props.onDragCancel?.(event);
        },
        onDragEnd: (event) => {
          mockDelivery.ended++;
          mockDelivery.target = event.over?.data?.current?.columnId ?? null;
          props.onDragEnd?.(event);
        },
      });
    },
  };
});

let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});

describe.each(['ShadCheckbox', 'ShadSwitch', 'ShadNumberInput'])('a custom card with a %s', (type) => {
  const numeric = type === 'ShadNumberInput';
  const required = type === 'ShadCheckbox';
  const role = numeric ? 'spinbutton' : required ? 'checkbox' : 'switch';
  const setter = numeric ? 'setText' : 'setValue';
  const edited = numeric ? 125 : true;
  const next = numeric ? 777 : false;
  const w = createWidgetHarness({
    componentType: 'ShadKanban',
    id: 'board1',
    handle: 'board1',
    widgetWidth: 900,
    widgetHeight: 500,
    capabilities: { dnd: true },
    preload: [type],
  });
  let host, user, control, card;
  const field = () => useStore.getState().getExposedValueOfComponent('field1', 'canvas', 0);
  const observed = () => ({
    visible: numeric ? Number(control.value.replace(/,/g, '')) : control.getAttribute('aria-checked') === 'true',
    published: field()?.value,
    ...(required ? { valid: field()?.isValid } : {}),
  });
  const expected = (value) => ({ visible: value, published: value, ...(required ? { valid: value === true } : {}) });
  const perform = async (fn, value) => {
    expect(fn).toBeInstanceOf(Function);
    await act(async () => fn(value));
  };
  beforeEach(async () => {
    await w.setup();
    user = userEvent.setup({ delay: null });
    mockDelivery = { started: 0, cancelled: 0, ended: 0, target: null };
    host = document.createElement('div');
    host.className = 'canvas-content';
    host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
    document.body.appendChild(host);
  });
  afterEach(() => {
    w.teardown();
    host.remove();
  });

  /** One card in todo whose field (a required Checkbox) was set by its action to `edited`. */
  const mount = async () => {
    const child = componentDefinition(
      'field1',
      'field1',
      type,
      {
        label: binding('Alpha'),
        [numeric ? 'defaultValue' : 'defaultChecked']: binding(numeric ? '{{10}}' : '{{false}}'),
      },
      { validation: required ? { mandatory: binding('{{true}}') } : {} }
    );
    child.component.parent = 'board1';
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 110 } };
    w.render({
      currentMode: 'view',
      extraComponents: { field1: child },
      properties: {
        data: binding('{{[{id:"a",title:"Alpha",status:"todo"}]}}'),
        idField: binding('id'),
        titleField: binding('title'),
        statusField: binding('status'),
        cardLayout: binding('custom'),
        cardHeight: binding('{{180}}'),
        columns: binding('{{["todo","done"]}}'),
      },
    });
    control = await screen.findByRole(role);
    card = control.closest('[aria-roledescription]');
    await waitFor(() => expect(field()?.[setter]).toBeInstanceOf(Function));
    await perform(field()[setter], edited);
    expect(observed()).toEqual(expected(edited));
  };

  test.each(['cancel', 'same-place drop'])('a %s keeps its value, validity and action', async (finish) => {
    await mount();
    act(() => card.focus());
    await user.keyboard(' ');
    await waitFor(() => expect(mockDelivery.started).toBe(1));
    const during = observed();
    await user.keyboard(finish === 'cancel' ? '{Escape}' : '{Enter}');
    if (finish === 'cancel') await waitFor(() => expect(mockDelivery).toMatchObject({ cancelled: 1, ended: 0 }));
    else await waitFor(() => expect(mockDelivery).toMatchObject({ cancelled: 0, ended: 1, target: 'todo' }));
    await waitFor(() => expect(screen.getAllByRole(role)).toHaveLength(1));
    expect(screen.getByRole(role)).toBe(control);
    expect(w.exposed().updatedCardData.map((row) => [row.id, row.status])).toEqual([['a', 'todo']]);
    const after = observed();
    await perform(field()?.[setter], next);
    expect({ during, after, action: observed() }).toEqual({
      during: expected(edited),
      after: expected(edited),
      action: expected(next),
    });
  });
});
