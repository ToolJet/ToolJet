// Release audit round 2 (Codex fixture, kept as written): RadioGroup and ToggleGroup took a user click on an option
// marked disabled. ButtonGroup already refused it (the control).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
import { fireEvent, screen } from '@testing-library/react';
test.each(
  ['ShadRadioGroup', 'ShadToggleGroup', 'ShadButtonGroup'].flatMap((type) =>
    [true, false].map((disabled) => [type, disabled])
  )
)('%s option disabled=%s controls user click', async (type, disabled) => {
  const w = createWidgetHarness({
    componentType: type,
    id: 'group1',
    handle: 'group1',
    widgetHeight: 180,
    widgetWidth: 500,
  });
  await w.setup();
  try {
    const options = [
      { label: 'Available', value: 'a' },
      { label: 'Target', value: 'b', disabled },
    ];
    w.render({
      currentMode: 'view',
      properties: {
        [type === 'ShadButtonGroup' ? 'buttons' : 'options']: binding('{{' + JSON.stringify(options) + '}}'),
        defaultValue: binding("{{''}}"),
        mode: binding('single'),
      },
    });
    const event = type === 'ShadRadioGroup' ? 'onSelectionChange' : 'onChange';
    w.setEvents(countInvocationsOn('group1', event));
    const target =
      type === 'ShadRadioGroup'
        ? screen.getByRole('radio', { name: 'Target' })
        : screen.getByText('Target').closest('button');
    expect(target).not.toBeNull();
    fireEvent.click(target);
    expect({ value: w.exposed().value, events: w.variables().calls || 0 }).toEqual({
      value: disabled ? '' : 'b',
      events: disabled ? 0 : 1,
    });
  } finally {
    w.teardown();
  }
});
