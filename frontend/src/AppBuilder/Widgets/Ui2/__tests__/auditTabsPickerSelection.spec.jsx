// Release audit round 2: Codex's fixture reviewTabsOtherPickerSelection, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
const types = [
  ['ShadColorPicker', { defaultValue: '#6366f1', swatches: '{{["#6366f1","#22c55e"]}}' }, 'onChange'],
  ['ShadDatePicker', { defaultValue: '2026-10-15', format: 'YYYY-MM-DD' }, 'onSelect'],
  ['ShadDateTimePicker', { defaultValue: '2026-10-15T09:00:00' }, 'onSelect'],
  ['ShadTimePicker', { defaultValue: '09:00', timeFormat: '24h', pickerStyle: 'list' }, 'onSelect'],
];
test.each(
  types.flatMap(([type, props, event]) =>
    ['switch', 'disable', 'enabled'].map((change) => [type, change, props, event])
  )
)(
  '%s inside Tabs blocks stale selection after %s',
  async (type, change, props, event) => {
    const w = createWidgetHarness({
      componentType: 'ShadTabs',
      id: 'tabs1',
      handle: 'tabs1',
      capabilities: { dnd: true },
      preload: [type],
      widgetHeight: 500,
      widgetWidth: 800,
    });
    await w.setup();
    try {
      const child = componentDefinition(
        'field1',
        'field1',
        type,
        Object.fromEntries(Object.entries(props).map(([k, v]) => [k, binding(v)]))
      );
      child.component.parent = 'tabs1-t0';
      child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
      child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 100 } };
      w.render({ currentMode: 'view', properties: { defaultTab: binding('t0') }, extraComponents: { field1: child } });
      await waitFor(() => expect(document.querySelector('[id^="shad-field1-"]')).not.toBeNull());
      const trigger = document.querySelector('[id^="shad-field1-"]'),
        panel = trigger.closest('[role="tabpanel"]');
      expect(panel).not.toBeNull();
      w.setEvents(countInvocationsOn('field1', event));
      fireEvent.click(trigger);
      let target;
      if (type === 'ShadColorPicker') target = await screen.findByRole('button', { name: '#22c55e' });
      else if (type === 'ShadTimePicker')
        target = within(await screen.findByRole('listbox', { name: 'Times' })).getByRole('option', { name: '10:00' });
      else
        target = within((await screen.findAllByRole('grid'))[0])
          .getByText('20')
          .closest('button');
      const before = w.exposed('field1').value;
      if (change === 'switch') {
        await w.act('setTab', 't1');
        expect(w.exposed().currentTab).toBe('t1');
        expect(panel).not.toBeVisible();
      }
      if (change === 'disable') {
        await w.act('setTabDisable', 't0', true);
        expect(panel.inert).toBe(true);
      }
      if (target.isConnected) fireEvent.click(target);
      if (change === 'enabled') {
        expect(w.variables().calls).toBe(1);
        expect(w.exposed('field1').value).not.toEqual(before);
      } else
        expect({ value: w.exposed('field1').value, events: w.variables().calls || 0 }).toEqual({
          value: before,
          events: 0,
        });
    } finally {
      w.teardown();
    }
  },
  15000
);
