/**
 * UI 2.0 Button group: attached buttons that act as actions, a single choice or several choices.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Button group itself does. Titles carry [ShadButtonGroup-<AREA>-<NNN>] scenario ids.
 * The registered defaults apply: Day, Week and Month, a single choice, Week selected.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'bg1';
const widget = createWidgetHarness({
  componentType: 'ShadButtonGroup',
  handle: 'group1',
  id: ID,
  widgetHeight: 80,
  widgetWidth: 360,
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const button = (name) => screen.getByRole('button', { name });
const press = async (name) => {
  await act(async () => fireEvent.click(button(name)));
};
const pressed = () =>
  screen
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => b.textContent);

describe('UI 2.0 Button group', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadButtonGroup-DEF-001] shows the buttons with the default one pressed, and exposes the selection', async () => {
    render();

    await waitFor(() => expect(pressed()).toEqual(['Week']));
    expect(screen.getByRole('group', { name: 'Button group' })).toBeInTheDocument();
    expect(exposed()).toMatchObject({ value: 'week', selected: ['week'], lastClicked: null, isValid: true });
  });

  test('[ShadButtonGroup-PROP-001] label and description name the group and help under it', async () => {
    render({ properties: { label: binding('Range'), description: binding('How much to show') } });

    expect(await screen.findByRole('group', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getByText('How much to show')).toBeInTheDocument();
  });

  test('[ShadButtonGroup-PROP-002] buttons take plain values, disabled buttons and icon-only buttons named by value', async () => {
    render({
      properties: {
        buttons: binding(
          "{{['Low', { label: 'High', value: 'high', disabled: true }, { label: '', value: 'star', icon: 'IconStar' }]}}"
        ),
        defaultValue: binding('Low'),
      },
    });

    await waitFor(() => expect(pressed()).toEqual(['Low']));
    expect(button('High')).toBeDisabled();
    expect(button('star')).toHaveAttribute('title', 'star');
  });

  test('[ShadButtonGroup-PROP-003] mode multiple toggles each button, and defaultValue takes a list', async () => {
    render({ properties: { mode: binding('multiple'), defaultValue: binding("{{['day']}}") } });
    await waitFor(() => expect(pressed()).toEqual(['Day']));

    await press('Month');
    await press('Day');

    await waitFor(() => expect(exposed()).toMatchObject({ value: ['month'], selected: ['month'] }));
    expect(pressed()).toEqual(['Month']);
  });

  test('[ShadButtonGroup-PROP-004] mode actions presses nothing and only reports the click', async () => {
    render({ properties: { mode: binding('actions') } });
    await handle([
      ...countInvocationsOn(ID, 'onClick', { key: 'clicks' }),
      ...countInvocationsOn(ID, 'onChange', { key: 'changes' }),
    ]);

    await screen.findByRole('button', { name: 'Day' });
    expect(button('Week')).not.toHaveAttribute('aria-pressed');
    await press('Day');

    await waitFor(() => expect(widget.variables().clicks).toBe(1));
    expect(widget.variables().changes).toBeUndefined();
    expect(exposed()).toMatchObject({ value: '', selected: [], lastClicked: { label: 'Day', value: 'day' } });
  });

  test('[ShadButtonGroup-PROP-005] a single choice stays picked when clicked again, unless allowDeselect is on', async () => {
    render();
    await screen.findByRole('button', { name: 'Week' });
    await press('Week');
    expect(pressed()).toEqual(['Week']);

    await act(async () => render({ properties: { allowDeselect: binding('{{true}}') } }));
    await press('Week');

    await waitFor(() => expect(exposed()).toMatchObject({ value: '', selected: [] }));
    expect(pressed()).toEqual([]);
  });

  test('[ShadButtonGroup-PROP-006] variant, size, orientation and fullWidth shape the group', async () => {
    render({
      properties: {
        variant: binding('secondary'),
        size: binding('lg'),
        orientation: binding('vertical'),
        fullWidth: binding('{{true}}'),
      },
    });

    const group = await screen.findByRole('group');
    expect(group).toHaveClass('tw-flex-col');
    expect(group).toHaveClass('tw-w-full');
    expect(button('Day')).toHaveClass('tw-bg-ui2-secondary');
    expect(button('Day')).toHaveClass('tw-h-10');
    expect(button('Day')).toHaveClass('tw-flex-1');
  });

  test('[ShadButtonGroup-EVT-001] clicking another button fires onClick then onChange, whose handlers read the new values', async () => {
    render();
    await handle([
      ...setVariableOn(ID, 'onClick', { key: 'clicked', value: '{{components.group1.lastClicked.label}}' }),
      ...setVariableOn(ID, 'onChange', { value: '{{components.group1.value}}' }),
    ]);

    await screen.findByRole('button', { name: 'Month' });
    await press('Month');

    await waitFor(() => expect(widget.variables().seen).toBe('month'));
    expect(widget.variables().clicked).toBe('Month');
    expect(exposed()).toMatchObject({ selected: ['month'], lastClicked: { label: 'Month', value: 'month' } });
  });

  test('[ShadButtonGroup-EVT-002] clicking the button already picked fires onClick but not onChange', async () => {
    render();
    await handle([
      ...countInvocationsOn(ID, 'onClick', { key: 'clicks' }),
      ...countInvocationsOn(ID, 'onChange', { key: 'changes' }),
    ]);

    await screen.findByRole('button', { name: 'Week' });
    await press('Week');

    await waitFor(() => expect(widget.variables().clicks).toBe(1));
    expect(widget.variables().changes).toBeUndefined();
  });

  test('[ShadButtonGroup-ACT-001] setSelected picks by value (ignoring unknown values) and clear empties the selection', async () => {
    render({ properties: { mode: binding('multiple'), defaultValue: binding("{{['day']}}") } });

    await widget.act('setSelected', ['month', 'nope']);
    await waitFor(() => expect(exposed().selected).toEqual(['month']));
    expect(pressed()).toEqual(['Month']);

    await widget.act('clear');
    await waitFor(() => expect(exposed()).toMatchObject({ value: [], selected: [] }));
    expect(pressed()).toEqual([]);
  });

  test('[ShadButtonGroup-VAL-001] a mandatory group left empty is invalid, marked required, and says so once touched', async () => {
    render({
      properties: { label: binding('Range'), allowDeselect: binding('{{true}}') },
      validation: { mandatory: binding('{{true}}') },
    });

    await waitFor(() => expect(exposed()).toMatchObject({ isMandatory: true, isValid: true }));
    expect(screen.getByText('*')).toBeInTheDocument();
    await press('Week');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await press('Day');
    await waitFor(() => expect(exposed().isValid).toBe(true));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('[ShadButtonGroup-VAL-003] a mandatory multiple-choice group is invalid when emptied and valid once one is picked', async () => {
    render({
      properties: { mode: binding('multiple'), defaultValue: binding("{{['day']}}") },
      validation: { mandatory: binding('{{true}}') },
    });

    await waitFor(() => expect(exposed()).toMatchObject({ isMandatory: true, isValid: true }));
    await press('Day');
    await waitFor(() => expect(exposed().isValid).toBe(false));
    await press('Week');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadButtonGroup-VAL-002] a customRule message makes the choice invalid and is shown under the group', async () => {
    render({
      validation: { customRule: binding("{{components.group1.value === 'day' ? 'Pick a longer range' : ''}}") },
    });

    await screen.findByRole('button', { name: 'Day' });
    await press('Day');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Pick a longer range')).toBeInTheDocument();
  });

  test('[ShadButtonGroup-STY-001] colour and radius styles reach the group as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#f8fafc'),
        hoverBackgroundColor: binding('#f1f5f9'),
        textColor: binding('#334155'),
        borderColor: binding('#cbd5e1'),
        selectedBackgroundColor: binding('#e11d48'),
        selectedTextColor: binding('#ffffff'),
        iconColor: binding('#64748b'),
        labelColor: binding('#0f172a'),
        borderRadius: binding('{{4}}'),
      },
    });

    await screen.findByRole('button', { name: 'Day' });
    const root = container.querySelector('.tj-shadcn');
    const vars = {
      '--lk-bg': '#f8fafc',
      '--lk-hover': '#f1f5f9',
      '--lk-fg': '#334155',
      '--lk-border': '#cbd5e1',
      '--lk-on-bg': '#e11d48',
      '--lk-on-fg': '#ffffff',
      '--lk-icon': '#64748b',
      '--lk-label': '#0f172a',
      '--lk-radius': '4px',
    };
    Object.entries(vars).forEach(([name, value]) => expect(root.style.getPropertyValue(name)).toBe(value));
    expect(button('Day').className).toContain('tw-bg-[color:var(--lk-bg)]');
  });
});
