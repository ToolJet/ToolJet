/**
 * UI 2.0 Color picker: a screen color picked with the EyeDropper is taken only while the picker can take it.
 *
 * Release audit round 2 (17 Oct): the browser's EyeDropper answers when the user has clicked somewhere on screen, which
 * can be long after the click that opened it. Its answer was committed whatever happened meanwhile: after the picker
 * was disabled, set loading, hidden or unmounted, and even into a new picker mounted with the same id (the old one's
 * answer changed the new one's exposed value and fired its onChange). The OS sampler is a controlled promise here.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'color1';
const widget = createWidgetHarness({
  componentType: 'ShadColorPicker',
  id: ID,
  handle: 'color1',
  preload: ['ShadColorPicker'],
});

let answer;
let cancel;
beforeEach(() => {
  window.EyeDropper = class {
    open() {
      return new Promise((resolve, reject) => {
        answer = resolve;
        cancel = reject;
      });
    }
  };
});
afterEach(() => {
  delete window.EyeDropper;
});

const render = () => widget.render({ currentMode: 'view', properties: { defaultValue: binding('#6366f1') } });
const startPicking = async () => {
  await act(async () => fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`)));
  await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Pick a color from the screen' })));
  expect(answer).toBeInstanceOf(Function);
};
const sample = (hex) => act(async () => answer({ sRGBHex: hex }));

describe('UI 2.0 Color picker EyeDropper', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadColorPicker-EYE-001] a picked screen color is taken while the picker is active (control)', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' }));
    await startPicking();
    await sample('#22c55e');
    await waitFor(() => expect(widget.exposed().value).toBe('#22c55e'));
    expect(widget.variables().changes).toBe(1);
  });

  test('[ShadColorPicker-EYE-002] a cancelled pick changes nothing (control)', async () => {
    render();
    await startPicking();
    await act(async () => cancel(new DOMException('aborted', 'AbortError')));
    expect(widget.exposed().value).toBe('#6366f1');
  });

  test.each([
    ['setDisable', true],
    ['setLoading', true],
    ['setVisibility', false],
  ])('[ShadColorPicker-EYE-003] a color sampled after %s(%s) is not taken', async (action, arg) => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' }));
    await startPicking();
    await widget.act(action, arg);
    await sample('#22c55e');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    expect({ value: widget.exposed().value, changes: widget.variables().changes ?? 0 }).toEqual({
      value: '#6366f1',
      changes: 0,
    });
  });

  test('[ShadColorPicker-EYE-004] a color sampled for a picker that unmounted reaches no picker, not even its replacement', async () => {
    const first = render();
    await startPicking();
    // Unmount it, then mount a new picker with the same id in a new session (the store is the app's one store).
    act(() => first.unmount());
    widget.teardown();
    await widget.setup();
    render();
    await waitFor(() => expect(document.querySelector(`[id^="shad-${ID}-"]`)).not.toBeNull());
    widget.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' }));
    await sample('#22c55e');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    expect({ value: widget.exposed().value, changes: widget.variables().changes ?? 0 }).toEqual({
      value: '#6366f1',
      changes: 0,
    });
  });
});
