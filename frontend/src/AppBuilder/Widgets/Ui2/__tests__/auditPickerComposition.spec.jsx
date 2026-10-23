// Release audit round 2: Codex's fixture reviewPickerComposition, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
test.each(
  ['ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['isComposing', 'keyCode229', 'ordinary'].map((mode) => [type, mode])
  )
)(
  '%s Enter composition guard %s',
  async (type, mode) => {
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
      w.render({
        currentMode: 'view',
        properties: {
          options: binding('{{[{label:"Alpha",value:"a"}]}}'),
          defaultValue: binding(multi ? '{{[]}}' : '{{null}}'),
          searchPlaceholder: binding('Audit search'),
        },
      });
      w.setEvents(countInvocationsOn('picker1', 'onSelect'));
      fireEvent.click(screen.getByRole('combobox'));
      const search = await screen.findByPlaceholderText('Audit search');
      fireEvent.change(search, { target: { value: 'Alpha' } });
      const option = await screen.findByRole('option', { name: 'Alpha' });
      // Multiselect initially highlights its Select all command; move once to the matching option.
      if (multi) fireEvent.keyDown(search, { key: 'ArrowDown' });
      await waitFor(() => expect(option.getAttribute('data-selected')).toBe('true'));
      fireEvent.keyDown(search, {
        key: 'Enter',
        code: 'Enter',
        keyCode: mode === 'keyCode229' ? 229 : 13,
        isComposing: mode === 'isComposing',
      });
      const selected = mode === 'ordinary';
      await waitFor(() =>
        expect({ value: w.exposed()[multi ? 'values' : 'value'], events: w.variables().calls || 0 }).toEqual({
          value: selected ? (multi ? ['a'] : 'a') : multi ? [] : '',
          events: selected ? 1 : 0,
        })
      );
    } finally {
      w.teardown();
    }
  },
  15000
);
