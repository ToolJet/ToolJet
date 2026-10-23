import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
/**
 * A disabled modal took no pointer input (an overlay covered its body) but its body stayed usable by keyboard and
 * through popups: Tab reached the body's Input and buttons, and a Select opened in the body kept its portalled list,
 * where picking "Two" changed the value (Codex round 8, CORE-R8E-01). Disabled, the body and the header and footer
 * slots are now inert and aria-disabled, still drawn, so focus skips them and the pack's popups close and refuse a
 * choice (parity.ts ownerTakesNoInput). Enabling the modal again gives everything back, drafts included.
 *
 * Native ModalV2 and the UI 2.0 Dialog drawn on it. Real store, real RenderWidget, real canvases.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { addPageCanvas, press } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

const ID = 'dlg1';
const OPTIONS = "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}";
const FOCUSABLE = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [role=combobox]';

const harnesses = Object.fromEntries(
  ['ModalV2', 'ShadDialog'].map((type) => [
    type,
    createWidgetHarness({
      componentType: type,
      handle: 'modal1',
      id: ID,
      capabilities: { dnd: true },
      preload: ['ShadInput', 'ShadSelect', 'ShadButton'],
      widgetHeight: 40,
      widgetWidth: 200,
    }),
  ])
);

const child = (id, type, properties, top, parent = ID) => {
  const c = componentDefinition(id, id, type, properties);
  c.component.parent = parent;
  c.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
  c.layouts = { desktop: { top, left: 0, width: 20, height: 70 } };
  return c;
};
const body = () => document.querySelector('.modal-body');
const footer = () => document.querySelector('.modal-footer');
const takesNoInput = (el) => !!el.closest('[inert]') && !!el.closest('[aria-disabled="true"]');

describe.each(['ModalV2', 'ShadDialog'])('%s disabled', (type) => {
  const widget = harnesses[type];
  let removeCanvas;
  beforeEach(() => {
    removeCanvas = addPageCanvas();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    removeCanvas();
  });

  const open = async () => {
    widget.render({
      currentMode: 'view',
      extraComponents: {
        field1: child('field1', 'ShadInput', { label: binding('Draft') }, 0),
        pick1: child('pick1', 'ShadSelect', { label: binding('Pick'), options: binding(OPTIONS) }, 80),
        save1: child('save1', 'ShadButton', { text: binding('Save') }, 0, `${ID}-footer`),
      },
    });
    await widget.act('open');
    return screen.findByLabelText('Draft');
  };

  it(`[${type}-DIS-001] keeps focus out of the body, still drawn, and gives it back when enabled`, async () => {
    const input = await open();
    await act(async () => fireEvent.change(input, { target: { value: 'unsaved draft' } }));
    await widget.act('setDisableModal', true);
    await waitFor(() => expect(takesNoInput(input)).toBe(true));
    // Every focusable element in the body is in an inert, aria-disabled part, which Tab skips; nothing is hidden.
    // The footer's components too (its overlay stopped only the pointer); the header's close button still works.
    const focusable = [...body().querySelectorAll(FOCUSABLE), ...footer().querySelectorAll(FOCUSABLE)];
    expect(focusable.length).toBeGreaterThanOrEqual(3); // the Input, the Select and the footer's Save
    expect(screen.getByRole('button', { name: 'Save', hidden: true }).closest('[inert]')).not.toBeNull();
    expect(focusable.filter((el) => !takesNoInput(el))).toEqual([]);
    expect(input.closest('[inert]').getAttribute('aria-hidden')).toBeNull();
    expect(input.closest('[inert]').style.visibility).not.toBe('hidden');

    await widget.act('setDisableModal', false);
    await waitFor(() => expect(input.closest('[inert]')).toBeNull());
    expect(input.closest('[aria-disabled="true"]')).toBeNull();
    expect(screen.getByLabelText('Draft')).toBe(input);
    expect(input).toHaveValue('unsaved draft');
    expect(screen.getByRole('button', { name: 'Save' }).closest('[inert]')).toBeNull();
  });

  it(`[${type}-DIS-003] still closes from the header's close button while disabled`, async () => {
    await open();
    await widget.act('setDisableModal', true);
    const close = document.querySelector('[data-cy="modal-close-button"]');
    expect(close.closest('[inert]')).toBeNull();
    await act(async () => fireEvent.click(close));
    await waitFor(() => expect(widget.exposed().show).toBe(false));
  });

  it(`[${type}-DIS-002] closes a Select opened in the body, and refuses its choice, until enabled`, async () => {
    await open();
    const trigger = within(body()).combobox();
    press(trigger);
    await screen.findByRole('listbox');
    const two = screen.getByRole('option', { name: 'Two' });

    await widget.act('setDisableModal', true);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    // A choice that still arrives from the list (a click already on its way) changes nothing.
    await act(async () => {
      fireEvent.pointerUp(two, { button: 0, pointerType: 'mouse' });
      fireEvent.click(two);
    });
    expect(widget.exposed('pick1').value).not.toBe(2);

    await widget.act('setDisableModal', false);
    await waitFor(() => expect(trigger.closest('[inert]')).toBeNull());
    press(trigger);
    const again = await screen.findByRole('option', { name: 'Two' });
    await act(async () => {
      fireEvent.pointerUp(again, { button: 0, pointerType: 'mouse' });
      fireEvent.click(again);
    });
    await waitFor(() => expect(widget.exposed('pick1').value).toBe(2));
  });
});

const within = (root) => ({ combobox: () => root.querySelector('[role=combobox]') });
