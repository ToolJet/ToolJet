/**
 * UI 2.0 Tabs: an open picker popup inside a tab closes when its tab is switched away, disabled or set loading, and
 * the picker works again when the tab returns. From the release audit's fixture (reviewTabsOpenPicker).
 * Titles carry [ShadTabs-OWN-NNN] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/widgetHarness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['switch', 'disable', 'loading'].map((change) => [type, change])
  )
)(
  '[ShadTabs-OWN-001] %s popup closes when owning tab changes: %s',
  async (type, change) => {
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
      const child = componentDefinition('field1', 'field1', type, {
        label: binding('Nested choice'),
        options: binding('{{[{label:"Alpha",value:"a"}]}}'),
        defaultValue: binding(type === 'ShadMultiselect' ? '{{[]}}' : '{{null}}'),
      });
      child.component.parent = 'tabs1-t0';
      child.component.definition.others = {
        showOnDesktop: binding('{{true}}'),
        showOnMobile: binding('{{true}}'),
      };
      child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 100 } };
      w.render({
        currentMode: 'view',
        properties: { defaultTab: binding('t0') },
        extraComponents: { field1: child },
      });
      const trigger = await screen.findByRole('combobox');
      const panel = trigger.closest('[role="tabpanel"]');
      expect(panel).not.toBeNull();
      if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      else fireEvent.click(trigger);
      await screen.findByRole('listbox');
      if (change === 'switch') await w.act('setTab', 't1');
      else await w.act(change === 'disable' ? 'setTabDisable' : 'setTabLoading', 't0', true);
      if (change === 'switch') {
        expect(w.exposed().currentTab).toBe('t1');
        expect(panel).not.toBeVisible();
      }
      if (change === 'disable') {
        expect(panel.inert).toBe(true);
        expect(panel.getAttribute('aria-disabled')).toBe('true');
      }
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(document.body.style.pointerEvents).not.toBe('none');
      if (change === 'switch') await w.act('setTab', 't0');
      else await w.act(change === 'disable' ? 'setTabDisable' : 'setTabLoading', 't0', false);
      const returned = await screen.findByRole('combobox');
      expect(screen.queryByRole('listbox')).toBeNull();
      if (type === 'ShadSelect') fireEvent.keyDown(returned, { key: 'ArrowDown' });
      else fireEvent.click(returned);
      fireEvent.click(await screen.findByRole('option', { name: 'Alpha' }));
      await waitFor(() =>
        expect(w.exposed('field1')[type === 'ShadMultiselect' ? 'values' : 'value']).toEqual(
          type === 'ShadMultiselect' ? ['a'] : 'a'
        )
      );
    } finally {
      w.teardown();
    }
  },
  15000
);
