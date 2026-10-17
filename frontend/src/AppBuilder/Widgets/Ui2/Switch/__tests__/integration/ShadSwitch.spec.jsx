/**
 * UI 2.0 Switch: an on/off toggle beside its label.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Switch itself does. Titles carry [ShadSwitch-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sw1';
const widget = createWidgetHarness({
  componentType: 'ShadSwitch',
  handle: 'switch1',
  id: ID,
  widgetHeight: 48,
  widgetWidth: 320,
  defaultProperties: { label: binding('Email alerts') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const toggle = () => screen.getByRole('switch');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Switch', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSwitch-DEF-001] shows the label and help text beside a switch that is off, and exposes false', async () => {
    render({ properties: { description: binding('Sent when an order ships') } });

    expect(await screen.findByRole('switch', { name: 'Email alerts' })).not.toBeChecked();
    expect(screen.getByText('Sent when an order ships')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(false));
    expect(exposed().label).toBe('Email alerts');
  });

  test('[ShadSwitch-PROP-001] defaultChecked starts the switch on', async () => {
    render({ properties: { defaultChecked: binding('{{true}}') } });

    await waitFor(() => expect(toggle()).toBeChecked());
    expect(exposed().value).toBe(true);
  });

  test('[ShadSwitch-EVT-001] flipping the switch fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.switch1.value}}' }));

    await act(async () => fireEvent.click(toggle()));
    await waitFor(() => expect(widget.variables().seen).toBe(true));
    expect(toggle()).toBeChecked();

    await act(async () => fireEvent.click(toggle()));
    await waitFor(() => expect(widget.variables().seen).toBe(false));
  });

  test('[ShadSwitch-ACT-001] toggle flips the switch and fires onChange', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange'));

    await widget.act('toggle');

    await waitFor(() => expect(toggle()).toBeChecked());
    expect(exposed().value).toBe(true);
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  // As the native Toggle switch's setValue: it turns it on or off and fires nothing (review, 2026-10-17).
  test('[ShadSwitch-ACT-002] setValue turns it on or off and fires nothing, as the native one does', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange'));

    expect(await widget.actNow('setValue', true)).toMatchObject({ value: true });
    await waitFor(() => expect(toggle()).toBeChecked());
    expect(await widget.actNow('setValue', false)).toMatchObject({ value: false });
    await waitFor(() => expect(toggle()).not.toBeChecked());

    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadSwitch-STY-001] accent, label, help and off colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#16a34a'),
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        offColor: binding('#d4d4d8'),
      },
    });

    await waitFor(() => expect(toggle()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-off')).toBe('#d4d4d8');
  });
});
