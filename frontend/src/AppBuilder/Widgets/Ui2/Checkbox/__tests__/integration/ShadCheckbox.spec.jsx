/**
 * UI 2.0 Checkbox: one yes/no choice beside its label.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Checkbox itself does. Titles carry [ShadCheckbox-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'chk1';
const widget = createWidgetHarness({
  componentType: 'ShadCheckbox',
  handle: 'checkbox1',
  id: ID,
  widgetHeight: 48,
  widgetWidth: 320,
  defaultProperties: { label: binding('I agree to the terms') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const box = () => screen.getByRole('checkbox');
const exposed = () => widget.exposed() ?? {};
const click = () => act(async () => fireEvent.click(box()));

describe('UI 2.0 Checkbox', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCheckbox-DEF-001] shows the label and help text beside an unchecked box, and exposes false', async () => {
    render({ properties: { description: binding('You can withdraw at any time') } });

    expect(await screen.findByRole('checkbox', { name: 'I agree to the terms' })).not.toBeChecked();
    expect(screen.getByText('You can withdraw at any time')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(false));
    expect(exposed()).toMatchObject({ label: 'I agree to the terms', isValid: true, isMandatory: false });
  });

  test('[ShadCheckbox-PROP-001] defaultChecked starts the box checked', async () => {
    render({ properties: { defaultChecked: binding('{{true}}') } });

    await waitFor(() => expect(box()).toBeChecked());
    expect(exposed().value).toBe(true);
  });

  test('[ShadCheckbox-EVT-001] checking fires onChange then onCheck, and both handlers read true', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onChange', { key: 'changed', value: '{{components.checkbox1.value}}' }),
      ...setVariableOn(ID, 'onCheck', { key: 'checked', value: '{{components.checkbox1.value}}' }),
      ...countInvocationsOn(ID, 'onUnCheck', { key: 'unchecks' }),
    ]);

    await click();

    await waitFor(() => expect(widget.variables().checked).toBe(true));
    expect(widget.variables().changed).toBe(true);
    expect(widget.variables().unchecks).toBeUndefined();
    expect(box()).toBeChecked();
  });

  test('[ShadCheckbox-EVT-002] unchecking fires onUnCheck, and its handler reads false', async () => {
    render({ properties: { defaultChecked: binding('{{true}}') } });
    widget.setEvents(setVariableOn(ID, 'onUnCheck', { value: '{{components.checkbox1.value}}' }));
    await waitFor(() => expect(box()).toBeChecked());

    await click();

    await waitFor(() => expect(widget.variables().seen).toBe(false));
    expect(box()).not.toBeChecked();
  });

  test('[ShadCheckbox-ACT-001] toggle flips the box and fires what a click fires', async () => {
    render();
    widget.setEvents([...countInvocationsOn(ID, 'onChange'), ...setVariableOn(ID, 'onCheck', { key: 'checked' })]);

    await widget.act('toggle');

    await waitFor(() => expect(box()).toBeChecked());
    expect(exposed().value).toBe(true);
    await waitFor(() => expect(widget.variables().checked).toBe('YES'));
    expect(widget.variables().calls).toBe(1);
  });

  test('[ShadCheckbox-ACT-002] setValue checks or unchecks, and setting the current value fires nothing', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange'));

    await widget.act('setValue', true);
    await waitFor(() => expect(box()).toBeChecked());
    await widget.act('setValue', true);
    await widget.act('setValue', false);
    await waitFor(() => expect(box()).not.toBeChecked());

    expect(exposed().value).toBe(false);
    await waitFor(() => expect(widget.variables().calls).toBe(2));
  });

  test('[ShadCheckbox-VAL-001] a mandatory box is invalid until checked, and says so once unchecked again', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();

    await click();
    await waitFor(() => expect(exposed().isValid).toBe(true));

    await click();
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');
    expect(box()).toHaveAttribute('aria-invalid', 'true');
  });

  test('[ShadCheckbox-VAL-002] a customRule message makes the choice invalid and is shown beside the box', async () => {
    render({ validation: { customRule: binding("{{components.checkbox1.value ? 'Not available yet' : ''}}") } });

    await click();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Not available yet')).toBeInTheDocument();
  });

  test('[ShadCheckbox-STY-001] accent, label, help, border and error colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#16a34a'),
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        borderColor: binding('#555555'),
        errorColor: binding('#b91c1c'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--lk-error')).toBe('#b91c1c');
  });
});
