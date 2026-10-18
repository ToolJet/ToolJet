/**
 * UI 2.0 Button as a native Form's submit button.
 *
 * Release audit round 2 (17 Oct): a Form submits when the Button named in its buttonToSubmit property is clicked:
 * the native Button announces its click with a `submitForm` event that the Form listens for. The UI 2.0 Button sent
 * nothing, so a Form whose submit button was a UI 2.0 Button never submitted. As the native Button, a click submits
 * (and still fires onClick); the click action fires onClick only; a disabled or loading Button does neither.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Form',
  id: 'form1',
  handle: 'form1',
  widgetHeight: 400,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadButton'],
});

const render = (buttonProperties = {}, buttonToSubmit = 'save1') => {
  const button = componentDefinition('save1', 'save1', 'ShadButton', {
    text: binding('Save'),
    ...Object.fromEntries(Object.entries(buttonProperties).map(([k, v]) => [k, binding(v)])),
  });
  button.component.parent = 'form1';
  button.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
  button.layouts = { desktop: { top: 10, left: 0, width: 10, height: 40 } };
  widget.render({
    currentMode: 'view',
    extraComponents: { save1: button },
    properties: { buttonToSubmit: binding(buttonToSubmit) },
  });
  widget.setEvents([
    ...countInvocationsOn('form1', 'onSubmit', { key: 'submits' }),
    ...countInvocationsOn('save1', 'onClick', { key: 'clicks' }),
  ]);
};
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 30)));

describe('UI 2.0 Button as a Form submit button', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadButton-FORM-001] clicking the Form’s submit button submits it and fires onClick', async () => {
    render();
    await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Save' })));
    await waitFor(() => expect(widget.variables().submits).toBe(1));
    expect(widget.variables().clicks).toBe(1);
  });

  test('[ShadButton-FORM-002] a Button the Form does not name submits nothing', async () => {
    render({}, 'none');
    await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Save' })));
    await waitFor(() => expect(widget.variables().clicks).toBe(1));
    await settle();
    expect(widget.variables().submits ?? 0).toBe(0);
  });

  test('[ShadButton-FORM-003] the click action fires onClick only, as the native Button’s', async () => {
    render();
    await screen.findByRole('button', { name: 'Save' });
    await act(async () => widget.exposed('save1').click());
    await waitFor(() => expect(widget.variables().clicks).toBe(1));
    await settle();
    expect(widget.variables().submits ?? 0).toBe(0);
  });

  test('[ShadButton-FORM-004] a disabled Button submits nothing', async () => {
    render({ disabledState: '{{true}}' });
    await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Save' })));
    await settle();
    expect(widget.variables().submits ?? 0).toBe(0);
    expect(widget.variables().clicks ?? 0).toBe(0);
  });
});
