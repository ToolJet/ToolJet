/**
 * UI 2.0 text boxes: an unmounted widget fires no onFocus.
 *
 * Release audit 6 (17 Oct): onFocus is fired a tick after focus (so a click that focuses and then clicks reads in
 * order), from a timer nobody owned: focus a box, unmount it before the tick, and onFocus still ran for a widget that
 * was gone. The picker focus helper already cancelled its timers on unmount.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'w1';
const TYPES = [
  'ShadInput',
  'ShadTextarea',
  'ShadPasswordInput',
  'ShadNumberInput',
  'ShadCurrencyInput',
  'ShadPhoneInput',
  'ShadOtpInput',
  'ShadTagsInput',
];
const harnesses = Object.fromEntries(
  TYPES.map((componentType) => [
    componentType,
    createWidgetHarness({ componentType, handle: 'widget1', id: ID, preload: [componentType] }),
  ])
);
const tick = () => act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

describe('[UI2-FOCUS-006] a text box unmounted right after focus fires no onFocus', () => {
  it.each(TYPES)('%s', async (componentType) => {
    const widget = harnesses[componentType];
    await widget.setup();
    const fired = [];
    try {
      const own = useStore.getState().eventsSlice.fireEvent;
      useStore.setState((state) => {
        state.eventsSlice.fireEvent = (eventName, ...rest) => {
          fired.push(eventName);
          return own(eventName, ...rest);
        };
      });
      const { unmount } = widget.render({ currentMode: 'view' });
      const box = () => document.querySelector('input:not([type=hidden]), textarea');
      await waitFor(() => expect(box()).not.toBeNull());

      // The control: focus on a mounted box fires onFocus once.
      await act(async () => box().focus());
      await tick();
      expect(fired.filter((e) => e === 'onFocus')).toHaveLength(1);
      await act(async () => box().blur());

      await act(async () => {
        box().focus();
        unmount();
      });
      await tick();
      expect(fired.filter((e) => e === 'onFocus')).toHaveLength(1);
    } finally {
      widget.teardown();
    }
  });
});
