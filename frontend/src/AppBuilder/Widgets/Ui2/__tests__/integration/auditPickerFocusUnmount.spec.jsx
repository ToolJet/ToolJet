// Release audit round 2: Codex's fixture reviewPickerFocusUnmount, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { act, fireEvent, screen } from '@testing-library/react';
const tick = () => act(async () => new Promise((resolve) => setTimeout(resolve, 30)));
test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['pending focus', 'pending blur', 'open blur action'].map((route) => [type, route])
  )
)(
  '%s %s',
  async (type, route) => {
    const w = createWidgetHarness({
      componentType: type,
      id: 'picker1',
      handle: 'picker1',
      widgetHeight: 150,
      widgetWidth: 500,
    });
    await w.setup();
    const fired = [];
    try {
      const own = useStore.getState().eventsSlice.fireEvent;
      useStore.setState((state) => {
        state.eventsSlice.fireEvent = (name, ...rest) => {
          fired.push(name);
          return own(name, ...rest);
        };
      });
      const { unmount } = w.render({
        currentMode: 'view',
        properties: {
          options: binding('{{[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}]}}'),
          defaultValue: binding(type === 'ShadMultiselect' ? '{{[]}}' : "{{''}}"),
        },
      });
      const trigger = screen.getByRole('combobox');
      if (route === 'pending focus') {
        act(() => {
          trigger.focus();
          unmount();
        });
        await tick();
        expect(fired.filter((x) => ['onFocus', 'onBlur'].includes(x))).toEqual([]);
      } else if (route === 'pending blur') {
        act(() => trigger.focus());
        await tick();
        expect(fired.filter((x) => x === 'onFocus')).toHaveLength(1);
        act(() => {
          trigger.blur();
          unmount();
        });
        await tick();
        expect(fired.filter((x) => ['onFocus', 'onBlur'].includes(x))).toEqual(['onFocus']);
      } else {
        act(() => trigger.focus());
        await tick();
        if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        else fireEvent.click(trigger);
        const list = await screen.findByRole('listbox');
        await tick();
        const activeBefore = document.activeElement;
        expect(activeBefore).not.toBe(document.body);
        await w.act('setBlur');
        await tick();
        // A blur action should actually remove focus from the popup control, not merely blur an inactive trigger.
        expect({
          sameActive: document.activeElement === activeBefore,
          insideList: list.contains(document.activeElement),
          blurCount: fired.filter((x) => x === 'onBlur').length,
        }).toEqual({ sameActive: false, insideList: false, blurCount: 1 });
      }
    } finally {
      w.teardown();
    }
  },
  15000
);
