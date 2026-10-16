/**
 * UI 2.0 Radio group: one choice from a short list, every option on screen.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Radio group itself does. Titles carry [ShadRadioGroup-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'rg1';
const widget = createWidgetHarness({
  componentType: 'ShadRadioGroup',
  handle: 'radiogroup1',
  id: ID,
  widgetHeight: 140,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Shipping'),
    options: binding(
      "{{[{ label: 'Standard', value: 'std' }, { label: 'Express', value: 'exp' }, { label: 'Pickup', value: 'pick' }]}}"
    ),
    defaultValue: binding(''),
  },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const radio = (name) => screen.getByRole('radio', { name });
const exposed = () => widget.exposed() ?? {};
const pick = (name) => act(async () => fireEvent.click(radio(name)));

describe('UI 2.0 Radio group', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadRadioGroup-DEF-001] shows the label, help text and one radio per option, none chosen', async () => {
    render({ properties: { description: binding('Pickup is free') } });

    expect(await screen.findByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Pickup is free')).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'false',
    ]);
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().selectedOption).toEqual({});
    expect(exposed().label).toBe('Shipping');
    expect(exposed().options.map((o) => o.value)).toEqual(['std', 'exp', 'pick']);
    expect(exposed()).toMatchObject({ isValid: true, isMandatory: false });
  });

  test('[ShadRadioGroup-PROP-001] options also take plain strings, each its own label and value', async () => {
    render({ properties: { options: binding("{{['Red', 'Green']}}") } });

    expect(await screen.findByRole('radio', { name: 'Green' })).toBeInTheDocument();
    await waitFor(() =>
      expect(exposed().options).toEqual([
        { label: 'Red', value: 'Red' },
        { label: 'Green', value: 'Green' },
      ])
    );
  });

  test('[ShadRadioGroup-PROP-002] defaultValue chooses that option and exposes it', async () => {
    render({ properties: { defaultValue: binding('exp') } });

    await waitFor(() => expect(radio('Express')).toHaveAttribute('aria-checked', 'true'));
    expect(exposed().value).toBe('exp');
    expect(exposed().selectedOption).toMatchObject({ label: 'Express', value: 'exp' });
  });

  test('[ShadRadioGroup-PROP-003] horizontal lays the options out in a row', async () => {
    render({ properties: { horizontal: binding('{{true}}') } });

    await waitFor(() => expect(screen.getByRole('radiogroup')).toHaveClass('tw-flex', 'tw-flex-wrap'));
    render({ properties: { horizontal: binding('{{false}}') } });
    await waitFor(() => expect(screen.getByRole('radiogroup')).not.toHaveClass('tw-flex-wrap'));
  });

  test('[ShadRadioGroup-DEF-002] a bound list of 10k options draws at most 100 radios', async () => {
    render({ properties: { options: binding('{{Array.from({ length: 10000 }, (_, i) => i)}}') } });

    await waitFor(() => expect(screen.getAllByRole('radio').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('radio').length).toBeLessThanOrEqual(101);
  });

  test('[ShadRadioGroup-EVT-001] choosing an option fires onSelectionChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelectionChange', { value: '{{components.radiogroup1.value}}' }));

    await pick('Pickup');

    await waitFor(() => expect(widget.variables().seen).toBe('pick'));
    expect(radio('Pickup')).toHaveAttribute('aria-checked', 'true');
    expect(exposed().selectedOption).toMatchObject({ label: 'Pickup' });
  });

  test('[ShadRadioGroup-ACT-001] selectOption chooses by value and deselectOption clears the choice', async () => {
    render();

    await widget.act('selectOption', 'exp');
    await waitFor(() => expect(radio('Express')).toHaveAttribute('aria-checked', 'true'));
    expect(exposed().value).toBe('exp');

    await widget.act('deselectOption');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(radio('Express')).toHaveAttribute('aria-checked', 'false');
    expect(exposed().selectedOption).toEqual({});
  });

  test('[ShadRadioGroup-VAL-001] a mandatory group is invalid until an option is chosen', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    expect(screen.getByText('*')).toBeInTheDocument();

    await pick('Standard');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadRadioGroup-VAL-002] a customRule message makes the choice invalid and is shown under the group', async () => {
    render({
      validation: { customRule: binding("{{components.radiogroup1.value === 'pick' ? 'Store closed today' : ''}}") },
    });

    await pick('Pickup');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('Store closed today');
  });

  test('[ShadRadioGroup-STY-001] accent, label, help, option text and error colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#16a34a'),
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        optionTextColor: binding('#333333'),
        errorColor: binding('#b91c1c'),
      },
    });

    await waitFor(() => expect(screen.getByRole('radiogroup')).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-fg')).toBe('#333333');
    expect(root.getPropertyValue('--lk-error')).toBe('#b91c1c');
  });
});
