/**
 * Loading, a Dialog (ToolJet's ModalV2) swapped its body for a spinner, which unmounted the body's components: what
 * was typed in them was lost when it stopped loading (found with Codex round 7's List view finding, R7-01). The body
 * stays mounted under the spinner, hidden and inert, and comes back as it was.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { addPageCanvas } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

const widget = createWidgetHarness({
  componentType: 'ShadDialog',
  handle: 'dialog1',
  id: 'dlg1',
  capabilities: { dnd: true },
  preload: ['ShadInput'],
  widgetHeight: 40,
  widgetWidth: 200,
});

describe('UI 2.0 Dialog loading', () => {
  let removeCanvas;
  beforeEach(() => {
    removeCanvas = addPageCanvas();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    removeCanvas();
  });

  test('keeps a draft typed in its body through loading', async () => {
    const child = componentDefinition('child1', 'child1', 'ShadInput', { label: binding('Draft') });
    child.component.parent = 'dlg1';
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
    child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 80 } };
    widget.render({ currentMode: 'view', extraComponents: { child1: child } });
    await widget.act('open');
    const input = await screen.findByLabelText('Draft');
    await act(async () => fireEvent.change(input, { target: { value: 'unsaved draft' } }));

    await widget.act('setLoading', true);
    await waitFor(() => expect(document.querySelector('.modal-body [aria-busy="true"]')).not.toBeNull());
    expect(screen.getByLabelText('Draft', { hidden: true })).toHaveValue('unsaved draft');

    await widget.act('setLoading', false);
    await waitFor(() => expect(document.querySelector('.modal-body [aria-busy="true"]')).toBeNull());
    expect(screen.getByLabelText('Draft')).toHaveValue('unsaved draft');
  });
});
