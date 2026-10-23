/**
 * UI 2.0 Toggle group: a segmented control, one option on at a time.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Toggle group itself does. Titles carry [ShadToggleGroup-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tg1';
const widget = createWidgetHarness({
  componentType: 'ShadToggleGroup',
  handle: 'togglegroup1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 320,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
// Radix draws a single-choice toggle group as radios.
const item = (name) => screen.getByRole('radio', { name });
const exposed = () => widget.exposed() ?? {};
const click = (name) => act(async () => fireEvent.click(item(name)));

describe('UI 2.0 Toggle group', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadToggleGroup-DEF-001] draws one button per option with the default one on, and exposes it', async () => {
    render();

    expect(await screen.findByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['All', 'Open', 'Closed']);
    await waitFor(() => expect(exposed().value).toBe('All'));
  });

  test('[ShadToggleGroup-PROP-001] options take label/value objects, and defaultValue picks by value', async () => {
    render({
      properties: {
        options: binding("{{[{ label: 'Day', value: 'd' }, { label: 'Week', value: 'w' }]}}"),
        defaultValue: binding('w'),
      },
    });

    await waitFor(() => expect(item('Week')).toHaveAttribute('aria-checked', 'true'));
    expect(exposed().value).toBe('w');
  });

  test('[ShadToggleGroup-PROP-002] fullWidth stretches the group across the widget', async () => {
    render({ properties: { fullWidth: binding('{{true}}') } });

    await waitFor(() => expect(screen.getByRole('group')).toHaveClass('tw-w-full'));
    render({ properties: { fullWidth: binding('{{false}}') } });
    await waitFor(() => expect(screen.getByRole('group')).not.toHaveClass('tw-w-full'));
  });

  test('[ShadToggleGroup-DEF-002] a bound list of 10k options draws at most 100 buttons', async () => {
    render({ properties: { options: binding('{{Array.from({ length: 10000 }, (_, i) => i)}}') } });

    await waitFor(() => expect(screen.getAllByRole('radio').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('radio').length).toBeLessThanOrEqual(101);
  });

  test('[ShadToggleGroup-EVT-001] choosing another option fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.togglegroup1.value}}' }));

    await click('Open');

    await waitFor(() => expect(widget.variables().seen).toBe('Open'));
    expect(item('Open')).toHaveAttribute('aria-checked', 'true');
    expect(item('All')).toHaveAttribute('aria-checked', 'false');
  });

  test('[ShadToggleGroup-EVT-002] clicking the option already on keeps it on and fires nothing', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange'));
    await waitFor(() => expect(item('All')).toHaveAttribute('aria-checked', 'true'));

    await click('All');
    expect(item('All')).toHaveAttribute('aria-checked', 'true');
    expect(exposed().value).toBe('All');

    // One real change afterwards: the count is 1, so the click on 'All' fired nothing.
    await click('Open');
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadToggleGroup-ACT-001] setSelected picks an option (an unknown value changes nothing) and clear leaves none on', async () => {
    render();

    await widget.act('setSelected', 'Closed');
    await waitFor(() => expect(item('Closed')).toHaveAttribute('aria-checked', 'true'));
    expect(exposed().value).toBe('Closed');

    await widget.act('setSelected', 'Archived');
    expect(exposed().value).toBe('Closed');

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  test('[ShadToggleGroup-STY-001] colours and radius reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#f4f4f5'),
        textColor: binding('#52525b'),
        selectedBackgroundColor: binding('#18181b'),
        selectedTextColor: binding('#fafafa'),
        borderRadius: binding('{{14}}'),
      },
    });

    await waitFor(() => expect(screen.getByRole('group')).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-bg')).toBe('#f4f4f5');
    expect(root.getPropertyValue('--lk-fg')).toBe('#52525b');
    expect(root.getPropertyValue('--lk-on-bg')).toBe('#18181b');
    expect(root.getPropertyValue('--lk-on-fg')).toBe('#fafafa');
    expect(root.getPropertyValue('--lk-radius')).toBe('14px');
  });

  test('[ShadToggleGroup-LAY-001] a strip wider than its box scrolls inside the widget, and End brings the last option into view', async () => {
    // Six options in a 544px box drew a 703px strip that the canvas clipped; End focused a clipped option.
    render({
      properties: {
        options: binding(
          "{{['Basic plan', 'Premium plan', 'Enterprise plan', 'Partner plan', 'Nonprofit plan', 'Legacy disabled choice']}}"
        ),
        defaultValue: binding('Basic plan'),
      },
    });
    const group = await screen.findByRole('group');
    const scroller = group.parentElement;
    // The strip scrolls in a box as wide as the widget (it is not cut off: every label is whole).
    expect(scroller).toHaveAttribute('data-toggle-scroll');
    expect(scroller).toHaveClass('tw-max-w-full', 'tw-overflow-x-auto', 'tw-overflow-y-hidden');
    expect(item('Legacy disabled choice')).toHaveClass('tw-whitespace-nowrap');
    // Keyboard End focuses the last option; focusing it scrolls the strip to it (the browser's focus scrolling).
    await act(async () => item('Basic plan').focus());
    await act(async () => fireEvent.keyDown(item('Basic plan'), { key: 'End' }));
    await waitFor(() => expect(item('Legacy disabled choice')).toHaveFocus());

    // Full width: the strip fills the widget, and grows past it to scroll rather than squeeze.
    render({ properties: { fullWidth: binding('{{true}}') } });
    await waitFor(() => expect(screen.getByRole('group')).toHaveClass('tw-w-full', 'tw-min-w-max'));
  });

  test('[ShadToggleGroup-PROP-003] an option marked disable: true (the native Button group spelling) takes no click', async () => {
    // Only `disabled` was read, so a legacy option stayed clickable and published its value.
    render({
      properties: {
        options: binding(
          "{{[{ label: 'Basic', value: 'basic' }, { label: 'Legacy disabled choice', value: 'legacy', disable: true }]}}"
        ),
        defaultValue: binding('basic'),
      },
    });
    widget.setEvents(countInvocationsOn(ID, 'onChange'));
    expect(await screen.findByRole('radio', { name: 'Legacy disabled choice' })).toBeDisabled();
    await click('Legacy disabled choice');
    expect(exposed().value).toBe('basic');
    expect(widget.variables().calls || 0).toBe(0);
  });
});
