// Release audit round 2: Codex's fixture reviewPickerNames, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
import { act, screen } from '@testing-library/react';

test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['label', 'empty-label', 'whitespace-label', 'empty-all', 'help'].map((route) => [type, route])
  )
)(
  '%s accessible name/help transition: %s',
  async (type, route) => {
    const w = createWidgetHarness({
      componentType: type,
      id: 'picker1',
      handle: 'picker1',
      widgetHeight: 140,
      widgetWidth: 500,
    });
    await w.setup();
    try {
      const multi = type === 'ShadMultiselect';
      w.render({
        currentMode: 'view',
        properties: {
          label: binding('Account'),
          description: binding('Choose account'),
          placeholder: binding('Pick account'),
          options: binding('{{[{label:"Alpha",value:"a"}]}}'),
          defaultValue: binding(multi ? '{{[]}}' : '{{null}}'),
        },
      });
      w.setEvents(countInvocationsOn('picker1', 'onSelect'));
      const set = async (key, value) => act(async () => w.setComponentProperty('picker1', key, value, 'properties'));
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAccessibleName('Account');
      if (route === 'label') {
        await set('label', 'Customer');
        expect(trigger).toHaveAccessibleName('Customer');
        expect(w.exposed().label).toBe('Customer');
      } else if (route === 'help') {
        expect(trigger).toHaveAccessibleDescription('Choose account');
        await set('description', 'Current customer');
        expect(trigger).toHaveAccessibleDescription('Current customer');
        await set('description', '');
        expect(trigger).not.toHaveAttribute('aria-describedby');
        expect(screen.queryByText('Current customer')).toBeNull();
      } else {
        await set('label', route === 'whitespace-label' ? '   ' : '');
        if (route === 'empty-all') {
          await set('placeholder', '');
          expect(trigger).toHaveAccessibleName();
        } else expect(trigger).toHaveAccessibleName('Pick account');
      }
      expect(w.variables().calls || 0).toBe(0);
    } finally {
      w.teardown();
    }
  },
  15000
);
