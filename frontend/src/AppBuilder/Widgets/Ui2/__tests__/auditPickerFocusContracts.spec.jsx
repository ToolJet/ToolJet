// Release audit round 2: Codex's fixture reviewPickerFocusContracts, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['closed actions', 'popup roundtrip'].map((route) => [type, route])
  )
)(
  '%s focus contract: %s',
  async (type, route) => {
    const w = createWidgetHarness({
      componentType: type,
      id: 'picker1',
      handle: 'picker1',
      widgetHeight: 150,
      widgetWidth: 500,
    });
    await w.setup();
    try {
      w.render({
        currentMode: 'view',
        properties: {
          options: binding('{{[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}]}}'),
          defaultValue: binding(type === 'ShadMultiselect' ? '{{[]}}' : "{{''}}"),
        },
      });
      w.setEvents([
        ...countInvocationsOn('picker1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('picker1', 'onBlur', { key: 'blurCalls' }),
        ...countInvocationsOn('picker1', 'onSelect', { key: 'selectCalls' }),
      ]);
      const trigger = screen.getByRole('combobox');
      await w.act('setFocus');
      await settle();
      expect(document.activeElement).toBe(trigger);
      await w.act('setFocus');
      await settle();
      expect({ focus: w.variables().focusCalls || 0, blur: w.variables().blurCalls || 0 }).toEqual({
        focus: 1,
        blur: 0,
      });
      if (route === 'popup roundtrip') {
        if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        else fireEvent.click(trigger);
        await screen.findByRole('listbox');
        await settle();
        expect({ focus: w.variables().focusCalls || 0, blur: w.variables().blurCalls || 0 }).toEqual({
          focus: 1,
          blur: 0,
        });
        fireEvent.keyDown(document.activeElement, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        await settle();
        expect(document.activeElement).toBe(trigger);
        expect({ focus: w.variables().focusCalls || 0, blur: w.variables().blurCalls || 0 }).toEqual({
          focus: 1,
          blur: 0,
        });
      }
      await w.act('setBlur');
      await settle();
      expect(document.activeElement).not.toBe(trigger);
      await w.act('setBlur');
      await settle();
      expect({
        focus: w.variables().focusCalls || 0,
        blur: w.variables().blurCalls || 0,
        select: w.variables().selectCalls || 0,
      }).toEqual({ focus: 1, blur: 1, select: 0 });
    } finally {
      w.teardown();
    }
  },
  15000
);
