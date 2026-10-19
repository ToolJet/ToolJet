/**
 * UI 2.0 pickers refuse an option the app disabled, from the popup and from an action.
 *
 * Release audit round 3 (18 Oct), Codex fixtures reviewSelectDisabledOption, reviewDisabledOptionParity and
 * reviewPickerDisabledParity, trimmed:
 *  - Select's popup items were never disabled, so a click (or End then Enter) picked a disabled option and fired
 *    onSelect.
 *  - Select's and Combobox's selectOption checked only `disabled`, not the native `disable` the options also take.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pickers = ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'];

test.each(
  pickers.flatMap((type) =>
    ['disabled', 'disable'].flatMap((flag) => ['click', 'action'].map((route) => [type, flag, route]))
  )
)('%s refuses an option with %s=true through %s', async (type, flag, route) => {
  const w = createWidgetHarness({
    componentType: type,
    id: 'picker1',
    handle: 'picker1',
    widgetHeight: 150,
    widgetWidth: 500,
  });
  await w.setup();
  try {
    const multi = type === 'ShadMultiselect';
    const options = [
      { label: 'Available', value: 'a' },
      { label: 'Unavailable', value: 'b', [flag]: true },
    ];
    w.render({
      currentMode: 'view',
      properties: {
        options: binding('{{' + JSON.stringify(options) + '}}'),
        defaultValue: binding(multi ? '{{[]}}' : "{{''}}"),
      },
    });
    w.setEvents(countInvocationsOn('picker1', 'onSelect'));
    const value = () => (multi ? w.exposed().values : w.exposed().value);
    const select = (v) => w.act(multi ? 'selectOptions' : 'selectOption', multi ? [v] : v);
    if (route === 'action') await select('b');
    else {
      const trigger = screen.getByRole('combobox');
      if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      else fireEvent.click(trigger);
      const option = await screen.findByRole('option', { name: 'Unavailable' });
      expect(option).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(option);
    }
    expect({ value: value(), events: w.variables().calls || 0 }).toEqual({ value: multi ? [] : '', events: 0 });
    // The enabled option still works.
    await select('a');
    expect(value()).toEqual(multi ? ['a'] : 'a');
  } finally {
    w.teardown();
  }
});

describe('ShadSelect popup', () => {
  const w = createWidgetHarness({ componentType: 'ShadSelect', id: 'sel1', handle: 'sel1' });
  const options = (disabled) =>
    '{{' +
    JSON.stringify([
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b', disabled },
    ]) +
    '}}';
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const mount = async (disabled) => {
    w.render({ currentMode: 'view', properties: { label: binding('Choice'), options: binding(options(disabled)) } });
    await act(async () =>
      w.setEvents(
        setVariableOn('sel1', 'onSelect', {
          key: 'history',
          value: '{{[...(variables.history||[]),components.sel1.value]}}',
        })
      )
    );
  };
  const open = async () => {
    await act(async () =>
      fireEvent.pointerDown(screen.getByRole('combobox'), { button: 0, pointerType: 'mouse', ctrlKey: false })
    );
    return screen.findByRole('option', { name: 'Beta' });
  };

  test('an option disabled while the popup is open refuses a click', async () => {
    await mount(false);
    await open();
    await act(async () => w.setComponentProperty('sel1', 'options', options(true), 'properties'));
    await userEvent.setup().click(screen.getByRole('option', { name: 'Beta' }));
    expect(w.exposed().value).toBe('');
    expect(w.variables().history).toBeUndefined();
  });

  test('End skips a disabled last option, and Enter picks the enabled one once', async () => {
    await mount(true);
    await open();
    await userEvent.setup().keyboard('{End}{Enter}');
    expect(w.exposed().value).toBe('a');
    expect(w.variables().history).toEqual(['a']);
  });

  test('an enabled option is picked by a click and fires once (the control)', async () => {
    await mount(false);
    await userEvent.setup().click(await open());
    expect(w.exposed().value).toBe('b');
    expect(w.variables().history).toEqual(['b']);
  });
});

test('ShadRadioGroup refuses an option with the native disable=true through click', async () => {
  const w = createWidgetHarness({ componentType: 'ShadRadioGroup', id: 'radio1', handle: 'radio1', widgetHeight: 150 });
  await w.setup();
  try {
    const options = [
      { label: 'Available', value: 'a' },
      { label: 'Unavailable', value: 'b', disable: true },
    ];
    w.render({ currentMode: 'view', properties: { options: binding('{{' + JSON.stringify(options) + '}}') } });
    w.setEvents(countInvocationsOn('radio1', 'onSelectionChange'));
    const target = screen.getByRole('radio', { name: 'Unavailable' });
    expect(target).toBeDisabled();
    fireEvent.click(target);
    expect({ value: w.exposed().value, events: w.variables().calls || 0 }).toEqual({ value: '', events: 0 });
  } finally {
    w.teardown();
  }
});
