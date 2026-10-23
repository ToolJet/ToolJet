/**
 * UI 2.0 Select: a single choice from a list.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Select itself does. Titles carry [ShadSelect-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sel1';
const widget = createWidgetHarness({
  componentType: 'ShadSelect',
  handle: 'select1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Country'),
    options: binding(
      "{{[{ label: 'India', value: 'in' }, { label: 'Japan', value: 'jp' }, { label: 'Peru', value: 'pe' }]}}"
    ),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const trigger = () => screen.getByRole('combobox');
const exposed = () => widget.exposed() ?? {};
/** Opens the list the way a pointer does (Radix listens for pointerdown) and picks an option by keyboard. */
const pick = async (label) => {
  await act(async () => {
    fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
  });
  const option = await screen.findByRole('option', { name: label });
  await act(async () => {
    fireEvent.keyDown(option, { key: 'Enter' });
  });
};

describe('UI 2.0 Select', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSelect-DEF-001] shows the label and the placeholder, and exposes an empty selection', async () => {
    render({ properties: { placeholder: binding('Pick a country') } });

    expect(await screen.findByText('Country')).toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Pick a country');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().selectedOption).toEqual({});
    expect(exposed().label).toBe('Country');
    expect(exposed().options).toHaveLength(3);
  });

  test('[ShadSelect-PROP-001] defaultValue selects that option and exposes it', async () => {
    render({ properties: { defaultValue: binding('jp') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('Japan'));
    expect(exposed().value).toBe('jp');
    expect(exposed().selectedOption).toMatchObject({ label: 'Japan', value: 'jp' });
  });

  test('[ShadSelect-PROP-002] description is shown as help text under the control', async () => {
    render({ properties: { description: binding('Where the order ships') } });

    expect(await screen.findByText('Where the order ships')).toBeInTheDocument();
  });

  test('[ShadSelect-EVT-001] picking an option fires onSelect, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.select1.value}}' }));

    await pick('Peru');

    await waitFor(() => expect(widget.variables().seen).toBe('pe'));
    expect(exposed().selectedOption).toMatchObject({ label: 'Peru' });
  });

  test('[ShadSelect-EVT-002] focusing and leaving the control fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => trigger().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => trigger().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadSelect-ACT-001] selectOption picks by value and clear empties the selection', async () => {
    render();

    await widget.act('selectOption', 'in');
    await waitFor(() => expect(exposed().value).toBe('in'));
    expect(trigger()).toHaveTextContent('India');

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(''));
  });

  test('[ShadSelect-ACT-002] setFocus and setBlur move focus to and from the control', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadSelect-VAL-001] a mandatory select with nothing picked is invalid and says so once touched', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await act(async () => {
      fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
    });
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await pick('India');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  // A required Yes/No select exposed false for "No" but reported isValid false: the check read false as nothing
  // picked (review, 2026-10-17). Nothing picked and a picked falsy value are different.
  test('[ShadSelect-VAL-003] a mandatory select accepts a picked false or 0, and stays invalid with nothing picked', async () => {
    render({
      properties: {
        options: binding(
          "{{[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'None', value: 0 }]}}"
        ),
      },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(exposed().isValid).toBe(false));

    await pick('No');
    await waitFor(() => expect(exposed().value).toBe(false));
    expect(exposed().isValid).toBe(true);
    expect(await widget.actNow('selectOption', 0)).toMatchObject({ value: 0, isValid: true });
    expect(await widget.actNow('clear')).toMatchObject({ value: '', isValid: false });
  });

  test('[ShadSelect-VAL-002] a customRule message makes the pick invalid and is shown under the control', async () => {
    render({
      validation: { customRule: binding("{{components.select1.value === 'pe' ? 'We do not ship to Peru' : ''}}") },
    });

    await pick('Peru');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('We do not ship to Peru')).toBeInTheDocument();
  });

  test('[ShadSelect-STY-001] colour styles reach the control as CSS variables', async () => {
    const { container } = render({ styles: { accentColor: binding('#e11d48') } });

    await waitFor(() => expect(trigger()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
  });

  test('[ShadSelect-PROP-010] Allow clear: an x clears the choice, and so does a click on the chosen option', async () => {
    // Once chosen, a value could not be taken back.
    render({ properties: { defaultValue: binding('jp') } });
    await waitFor(() => expect(trigger()).toHaveTextContent('Japan'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Clear selection' })));
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().selectedOption).toEqual({});
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();

    await pick('Peru');
    await waitFor(() => expect(exposed().value).toBe('pe'));
    await act(async () => {
      fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
    });
    const chosen = await screen.findByRole('option', { name: 'Peru' });
    await act(async () => fireEvent.pointerUp(chosen, { button: 0, pointerType: 'mouse' }));
    await waitFor(() => expect(exposed().value).toBe(''));
  });

  test('[ShadSelect-PROP-011] no clearing when Allow clear is off or the field is mandatory', async () => {
    render({ properties: { defaultValue: binding('jp'), allowClear: binding('{{false}}') } });
    await waitFor(() => expect(trigger()).toHaveTextContent('Japan'));
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();

    render({ properties: { defaultValue: binding('jp') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(trigger()).toHaveTextContent('Japan'));
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });
});
