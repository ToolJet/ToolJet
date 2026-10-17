/**
 * UI 2.0 Dialog: ToolJet's ModalV2 in the UI 2.0 look, a trigger button and a dialog (or side sheet) with a header,
 * a body canvas and a footer.
 *
 * Real store, real RenderWidget, real widget, a real child widget in the body canvas; nothing is mocked. The open
 * dialog mounts SubContainers, so the harness has the app's drag-and-drop provider (`capabilities: { dnd: true }`),
 * and the page's canvas area (`.tj-canvas-area`, where ModalV2 portals) is put on the page as the app builder does.
 * The Dialog keeps ModalV2's controls (disabledTrigger, disabledModal, setDisableTrigger, setDisableModal), so
 * Ui2/__tests__/controlState.spec.jsx skips it and this file covers them. Titles carry [ShadDialog-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'dlg1';
const widget = createWidgetHarness({
  componentType: 'ShadDialog',
  handle: 'dialog1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 200,
  capabilities: { dnd: true },
  preload: ['ShadText'],
});

/** A Text widget in the dialog's body canvas. */
const BODY = (() => {
  const child = componentDefinition('inBody', 'inBody', 'ShadText', { text: binding('Dialog body text') });
  child.component.parent = ID;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 30 } };
  return { inBody: child };
})();

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rerender = (options) => act(async () => render(options));
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const trigger = () => document.querySelector('button.tj-shad-trigger');
const body = () => document.querySelector('[data-cy="modal-body"]');
const dialog = () => body()?.closest('.modal-dialog');
const closeButton = () => document.querySelector('[data-cy="modal-close-button"]');
const openByButton = async () => {
  await waitFor(() => expect(trigger()).toBeInTheDocument());
  await act(async () => fireEvent.click(trigger()));
  await waitFor(() => expect(body()).toBeInTheDocument());
};
const closed = async () => {
  await waitFor(() => expect(exposed().show).toBe(false));
  await waitFor(() => expect(body()).not.toBeInTheDocument(), { timeout: 3000 });
};

describe('UI 2.0 Dialog', () => {
  beforeEach(() => {
    const host = document.createElement('div');
    host.className = 'canvas-container page-container';
    host.innerHTML = '<div class="canvas-content"><div class="tj-canvas-area real-canvas"></div></div>';
    document.body.appendChild(host);
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    document.querySelectorAll('.page-container').forEach((n) => n.remove());
  });

  test('[ShadDialog-DEF-001] shows its trigger button in the UI 2.0 look, the dialog closed', async () => {
    render();

    await waitFor(() => expect(trigger()).toHaveTextContent('Open dialog'));
    expect(body()).not.toBeInTheDocument();
    expect(exposed()).toMatchObject({ show: false, isDisabledTrigger: false, isDisabledModal: false, isVisible: true });
  });

  test('[ShadDialog-EVT-001] the trigger opens the dialog in the UI 2.0 look and fires onOpen, whose handler reads show', async () => {
    render();
    await handle(setVariableOn(ID, 'onOpen', { value: '{{components.dialog1.show}}' }));

    await openByButton();

    await waitFor(() => expect(widget.variables().seen).toBe(true));
    expect(dialog()).toHaveClass('tj-shad-dialog');
    expect(body().closest('.modal-content')).toHaveClass('tj-shad-dialog-content');
  });

  test('[ShadDialog-EVT-002] the close button closes the dialog and fires onClose', async () => {
    render();
    await handle(setVariableOn(ID, 'onClose'));
    await openByButton();

    await act(async () => fireEvent.click(closeButton()));

    await waitFor(() => expect(widget.variables().seen).toBe('YES'));
    await closed();
  });

  // BUG: ModalV2's hideModal (ModalV2/ModalV2.jsx) fires onClose before it sets `show` to false, so an onClose
  // handler reading {{components.dialog1.show}} still sees true (the stale exposed value class).
  test.failing('[ShadDialog-EVT-003] an onClose handler reads show as false', async () => {
    render();
    await handle(setVariableOn(ID, 'onClose', { value: '{{components.dialog1.show}}' }));
    await openByButton();

    await act(async () => fireEvent.click(closeButton()));

    await waitFor(() => expect(widget.variables().seen).toBe(false), { timeout: 1000 });
  });

  // Ported from the pack's container suite: the body canvas keeps its component across closing and reopening.
  test('[ShadDialog-PROP-001] useDefaultButton off drops the trigger; the dialog opens from actions with its body component', async () => {
    render({ properties: { useDefaultButton: binding('{{false}}') }, extraComponents: BODY });
    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(trigger()).not.toBeInTheDocument();

    await widget.act('open');
    expect(await screen.findByText('Dialog body text')).toBeInTheDocument();
    await widget.act('close');
    await closed();
    await widget.act('open');

    expect(await screen.findByText('Dialog body text')).toBeInTheDocument();
  });

  test('[ShadDialog-PROP-002] triggerButtonLabel names the trigger button', async () => {
    render({ properties: { triggerButtonLabel: binding('Edit customer') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('Edit customer'));
  });

  test('[ShadDialog-PROP-003] showHeader, showFooter and hideCloseButton drop the header, the footer and the close button', async () => {
    render({ properties: { hideCloseButton: binding('{{true}}') } });
    await openByButton();
    expect(document.querySelector('[data-cy="modal-header"]')).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();

    await rerender({ properties: { showHeader: binding('{{false}}'), showFooter: binding('{{false}}') } });

    expect(document.querySelector('[data-cy="modal-header"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="modal-footer"]')).not.toBeInTheDocument();
    expect(body()).toBeInTheDocument();
  });

  test('[ShadDialog-PROP-004] size sets the dialog width class and modalHeight its height', async () => {
    render({ properties: { size: binding('sm'), modalHeight: binding('{{250}}') } });
    await openByButton();

    expect(dialog()).toHaveClass('modal-sm');
    await waitFor(() => expect(body().closest('.modal-content').style.height).toBe('250px'));

    await rerender({ properties: { size: binding('xl') } });
    expect(dialog()).toHaveClass('modal-xl');
  });

  test('[ShadDialog-PROP-005] variant sheet slides in from the right, or from the left with side left', async () => {
    render({ properties: { variant: binding('sheet') } });
    await openByButton();
    expect(dialog()).toHaveClass('tj-shad-sheet', 'tj-shad-sheet--right');

    await rerender({ properties: { variant: binding('sheet'), side: binding('left') } });
    expect(dialog()).toHaveClass('tj-shad-sheet--left');
  });

  test('[ShadDialog-PROP-006] Escape closes the dialog, unless hideOnEsc is off', async () => {
    render({ properties: { hideOnEsc: binding('{{false}}') } });
    await openByButton();
    await act(async () => fireEvent.keyDown(body(), { key: 'Escape', code: 'Escape' }));
    expect(exposed().show).toBe(true);

    await rerender({ properties: { hideOnEsc: binding('{{true}}') } });
    await act(async () => fireEvent.keyDown(body(), { key: 'Escape', code: 'Escape' }));

    await closed();
  });

  test('[ShadDialog-PROP-007] a press outside the dialog closes it only with closeOnClickingOutside on', async () => {
    // ModalV2 takes a press on the dialog's outer wrapper (three levels above the body) as outside.
    const outside = () => body().parentElement.parentElement.parentElement;
    render();
    await openByButton();
    await act(async () => fireEvent.mouseDown(outside()));
    expect(exposed().show).toBe(true);

    await rerender({ properties: { closeOnClickingOutside: binding('{{true}}') } });
    await act(async () => fireEvent.mouseDown(outside()));

    await closed();
  });

  test('[ShadDialog-PROP-008] disabledTrigger disables the trigger; disabledModal lays a blocking overlay over the open dialog', async () => {
    render({ properties: { disabledTrigger: binding('{{true}}') } });
    await waitFor(() => expect(trigger()).toBeDisabled());
    expect(exposed().isDisabledTrigger).toBe(true);

    await rerender({ properties: { disabledModal: binding('{{true}}') } });
    await openByButton();

    expect(document.getElementById(`${ID}-body-disabled`)).toBeInTheDocument();
    expect(exposed().isDisabledModal).toBe(true);
  });

  test('[ShadDialog-ACT-001] open and close show and hide the dialog, firing onOpen and onClose', async () => {
    render();
    await handle([
      ...setVariableOn(ID, 'onOpen', { key: 'opened' }),
      ...setVariableOn(ID, 'onClose', { key: 'closedEvent' }),
    ]);

    await widget.act('open');
    await waitFor(() => expect(body()).toBeInTheDocument());
    expect(exposed().show).toBe(true);
    await waitFor(() => expect(widget.variables().opened).toBe('YES'));

    await widget.act('close');
    await closed();
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(widget.variables().closedEvent).toBe('YES');
  });

  test('[ShadDialog-ACT-002] setDisableTrigger disables and enables the trigger at run time', async () => {
    render();
    await waitFor(() => expect(trigger()).toBeEnabled());

    await widget.act('setDisableTrigger', true);
    await waitFor(() => expect(trigger()).toBeDisabled());
    expect(exposed().isDisabledTrigger).toBe(true);

    await widget.act('setDisableTrigger', false);
    await waitFor(() => expect(trigger()).toBeEnabled());
    expect(exposed().isDisabledTrigger).toBe(false);
  });

  test('[ShadDialog-ACT-003] setDisableModal blocks and unblocks the open dialog at run time', async () => {
    render();
    await openByButton();
    expect(document.getElementById(`${ID}-body-disabled`)).not.toBeInTheDocument();

    await widget.act('setDisableModal', true);
    await waitFor(() => expect(document.getElementById(`${ID}-body-disabled`)).toBeInTheDocument());
    expect(exposed().isDisabledModal).toBe(true);

    await widget.act('setDisableModal', false);
    await waitFor(() => expect(document.getElementById(`${ID}-body-disabled`)).not.toBeInTheDocument());
  });

  test('[ShadDialog-ACT-004] visibility and setVisibility hide the trigger; setLoading shows a spinner in the body', async () => {
    render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(trigger()).not.toBeInTheDocument();

    await rerender({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(trigger()).toBeInTheDocument());
    await widget.act('setVisibility', false);
    await waitFor(() => expect(trigger()).not.toBeInTheDocument());
    await widget.act('setVisibility', true);

    await openByButton();
    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(body().querySelector('.spinner-border, [role=status]')).toBeInTheDocument();
  });

  test('[ShadDialog-STY-001] header, body and footer colours and the divider colours style the open dialog', async () => {
    render({
      styles: {
        headerBackgroundColor: binding('#fef2f2'),
        bodyBackgroundColor: binding('#f8fafc'),
        footerBackgroundColor: binding('#f0fdf4'),
        headerDividerColor: binding('#e11d48'),
        footerDividerColor: binding('#16a34a'),
      },
    });
    await openByButton();

    const header = document.querySelector('[data-cy="modal-header"]');
    const footer = document.querySelector('[data-cy="modal-footer"]');
    expect(header).toHaveStyle({ backgroundColor: '#fef2f2' });
    expect(body()).toHaveStyle({ backgroundColor: '#f8fafc' });
    expect(footer).toHaveStyle({ backgroundColor: '#f0fdf4' });
    expect(header.style.getPropertyValue('--cc-modal-header-divider-color')).toBe('#e11d48');
    expect(footer.style.getPropertyValue('--cc-modal-footer-divider-color')).toBe('#16a34a');
  });

  test('[ShadDialog-STY-002] trigger button colours, text, alignment and icon style the trigger', async () => {
    render({
      styles: {
        triggerButtonBackgroundColor: binding('#0f172a'),
        triggerButtonTextColor: binding('#f8fafc'),
        triggerButtonHoverBackgroundMode: binding('manual'),
        triggerButtonHoverBackgroundColor: binding('#e11d48'),
        triggerButtonTextSize: binding('{{18}}'),
        triggerButtonFontWeight: binding('medium'),
        triggerButtonContentAlignment: binding('left'),
        direction: binding('right'),
        iconVisibility: binding(true),
        icon: binding('IconStar'),
        iconColor: binding('#facc15'),
      },
    });

    await waitFor(() => expect(trigger()).toBeInTheDocument());
    expect(trigger()).toHaveStyle({ backgroundColor: '#0f172a', color: '#f8fafc', justifyContent: 'flex-start' });
    expect(trigger().style.getPropertyValue('--tblr-btn-color-darker')).toBe('#e11d48');
    expect(trigger().querySelector('span')).toHaveStyle({ fontSize: '18px', fontWeight: '500' });
    await waitFor(() => expect(trigger().querySelector('svg')).toBeInTheDocument());
    expect(trigger().querySelector('svg')).toHaveStyle({ color: '#facc15' });
  });
});
