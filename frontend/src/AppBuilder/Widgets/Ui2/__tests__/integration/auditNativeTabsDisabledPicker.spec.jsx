/**
 * A UI 2.0 picker inside a native Tabs pane takes no choice once the app disables that pane.
 *
 * Release audit round 3 (18 Oct), Codex fixture reviewNativeTabsStalePicker, trimmed to the failing "disable" case
 * and its control: native Tabs marks a disabled pane with data-disabled and pointer-events:none (not inert or
 * aria-disabled), so a popup opened before setTabDisable stayed open and its choice still landed.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { fireEvent, screen } from '@testing-library/react';

test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['disable', 'enabled'].map((change) => [type, change])
  )
)(
  '%s in a native Tabs pane, open popup after: %s',
  async (type, change) => {
    const w = createWidgetHarness({
      componentType: 'Tabs',
      id: 'tabs1',
      handle: 'tabs1',
      capabilities: { dnd: true },
      preload: [type],
      widgetHeight: 500,
      widgetWidth: 800,
    });
    await w.setup();
    try {
      const multi = type === 'ShadMultiselect';
      const child = componentDefinition('field1', 'field1', type, {
        label: binding('Nested choice'),
        options: binding('{{[{label:"Alpha",value:"a"}]}}'),
        defaultValue: binding(multi ? '{{[]}}' : '{{null}}'),
      });
      child.component.parent = 'tabs1-t0';
      child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
      child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 100 } };
      w.render({ currentMode: 'view', properties: { defaultTab: binding('t0') }, extraComponents: { field1: child } });
      w.setEvents(countInvocationsOn('field1', 'onSelect'));
      const trigger = await screen.findByRole('combobox');
      const panel = trigger.closest('.tab-pane');
      expect(panel).not.toBeNull();
      if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      else fireEvent.click(trigger);
      await screen.findByRole('listbox');
      if (change === 'disable') {
        await w.act('setTabDisable', 't0', true);
        expect(panel).toHaveAttribute('data-disabled', 'true');
        expect(panel.style.pointerEvents).toBe('none');
      }
      const option = screen.queryByRole('option', { name: 'Alpha' });
      if (option) fireEvent.click(option);
      const enabled = change === 'enabled';
      expect({ value: w.exposed('field1')[multi ? 'values' : 'value'], events: w.variables().calls || 0 }).toEqual({
        value: enabled ? (multi ? ['a'] : 'a') : multi ? [] : '',
        events: enabled ? 1 : 0,
      });
    } finally {
      w.teardown();
    }
  },
  15000
);
