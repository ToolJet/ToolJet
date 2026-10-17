/**
 * UI 2.0 Dialog with a picker inside: Escape closes the picker, not the dialog (release audit 21), and the open dialog
 * is named by the heading in its header (12). Titles carry [ShadDialog-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { addPageCanvas } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

const PICKERS = [
  ['ShadSelect', '[role=combobox]', '[role=listbox]'],
  ['ShadDatePicker', 'button', '[role=dialog][aria-label="Choose a date"]'],
  ['ShadCombobox', '[role=combobox]', '[role=dialog][aria-label="Options"]'],
];
const open = () => !!document.querySelector('.modal.show');

describe.each(PICKERS)('UI 2.0 Dialog holding a %s', (type, trigger, overlay) => {
  const widget = createWidgetHarness({
    componentType: 'ShadDialog',
    handle: 'dialog1',
    id: 'dlg1',
    capabilities: { dnd: true },
    preload: [type, 'ShadHeading'],
    widgetHeight: 40,
    widgetWidth: 200,
  });
  let removeCanvas;
  beforeEach(() => {
    removeCanvas = addPageCanvas();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    removeCanvas();
  });

  test(`[ShadDialog-NEST-001] Escape in the open ${type} closes it and keeps the dialog open`, async () => {
    const child = componentDefinition('child1', 'child1', type, { label: binding('Nested field') });
    child.component.parent = 'dlg1';
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
    child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 80 } };
    widget.render({ currentMode: 'view', extraComponents: { child1: child } });
    await widget.act('open');
    const box = () => document.querySelector(`._tooljet-${type}`);
    await waitFor(() => expect(box()).toBeInTheDocument());
    const user = userEvent.setup({ delay: null });
    await user.click(box().querySelector(trigger));
    await waitFor(() => expect(document.querySelector(overlay)).toBeInTheDocument());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector(overlay)).toBeNull());
    await act(() => new Promise((r) => setTimeout(r, 400)));
    expect(open()).toBe(true);
    expect(widget.exposed().show).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(open()).toBe(false));
  });
});

describe('UI 2.0 Dialog name', () => {
  const widget = createWidgetHarness({
    componentType: 'ShadDialog',
    handle: 'dialog1',
    id: 'dlg1',
    capabilities: { dnd: true },
    preload: ['ShadHeading'],
    widgetHeight: 40,
    widgetWidth: 200,
  });
  let removeCanvas;
  beforeEach(() => {
    removeCanvas = addPageCanvas();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    removeCanvas();
  });

  test('[ShadDialog-NAME-001] the open dialog is named by the heading in its header', async () => {
    const heading = componentDefinition('title1', 'title1', 'ShadHeading', {
      text: binding('New booking'),
      level: binding('h4'),
    });
    heading.component.parent = 'dlg1-header';
    heading.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
    heading.layouts = { desktop: { top: 0, left: 0, width: 20, height: 32 } };
    widget.render({ currentMode: 'view', extraComponents: { title1: heading } });
    await widget.act('open');
    await waitFor(() => expect(screen.getByText('New booking')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'New booking' })).toBeInTheDocument());
  });
});
