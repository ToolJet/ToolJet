// Release audit round 2: Codex's fixture reviewCurrentEyeDropperLifecycle, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';
const w = createWidgetHarness({ componentType: 'ShadColorPicker', id: 'color1', handle: 'color1', widgetWidth: 400 });
const original = Object.getOwnPropertyDescriptor(window, 'EyeDropper');
let resolvePick, rejectPick, openMock;
beforeEach(async () => {
  await w.setup();
  openMock = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        resolvePick = resolve;
        rejectPick = reject;
      })
  );
  Object.defineProperty(window, 'EyeDropper', {
    configurable: true,
    writable: true,
    value: class {
      open() {
        return openMock();
      }
    },
  });
});
afterEach(() => {
  w.teardown();
  if (original) Object.defineProperty(window, 'EyeDropper', original);
  else delete window.EyeDropper;
});
async function mount() {
  w.render({
    currentMode: 'view',
    properties: { label: binding('Accent'), defaultValue: binding('#ff0000'), showSwatches: binding('{{false}}') },
  });
  await waitFor(() => expect(w.exposed().value).toBe('#ff0000'));
  w.setEvents(
    setVariableOn('color1', 'onChange', {
      key: 'changes',
      value: '{{[...(variables.changes||[]),components.color1.value]}}',
    })
  );
}
async function start() {
  await mount();
  await act(async () => fireEvent.click(document.getElementById('shad-color1')));
  await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Pick a color from the screen' })));
  expect(openMock).toHaveBeenCalledTimes(1);
}
const finish = async (value = '#00ff00') => act(async () => resolvePick({ sRGBHex: value }));
test('successful active eyedropper publishes selected color exactly once', async () => {
  await start();
  await finish();
  expect(w.exposed().value).toBe('#00ff00');
  expect(w.variables().changes).toEqual(['#00ff00']);
});
test('cancellation preserves value and emits no change', async () => {
  await start();
  await act(async () => rejectPick(new DOMException('Cancelled', 'AbortError')));
  expect(w.exposed().value).toBe('#ff0000');
  expect(w.variables().changes).toBeUndefined();
});
test('invalid result preserves value and emits no change', async () => {
  await start();
  await finish('not-a-color');
  expect(w.exposed().value).toBe('#ff0000');
  expect(w.variables().changes).toBeUndefined();
});
test('same-color result emits no redundant change', async () => {
  await start();
  await finish('#ff0000');
  expect(w.exposed().value).toBe('#ff0000');
  expect(w.variables().changes).toBeUndefined();
});
test.each(['setDisable', 'setLoading', 'setVisibility'])(
  'pending result must not commit after %s changes interaction state',
  async (action) => {
    await start();
    await w.act(action, action !== 'setVisibility');
    expect(
      w.exposed()[action === 'setDisable' ? 'isDisabled' : action === 'setLoading' ? 'isLoading' : 'isVisible']
    ).toBe(action !== 'setVisibility');
    if (action === 'setVisibility') expect(document.getElementById('shad-color1')).not.toBeVisible();
    else expect(document.getElementById('shad-color1')).toBeDisabled();
    await finish();
    expect({ value: w.exposed().value, changes: w.variables().changes }).toEqual({
      value: '#ff0000',
      changes: undefined,
    });
  }
);
test('unmounted component must not publish or run workflows when eyedropper finishes', async () => {
  await start();
  act(() => w.session.render(<></>));
  expect(document.getElementById('shad-color1')).toBeNull();
  await finish();
  expect({ value: w.exposed().value, changes: w.variables().changes }).toEqual({
    value: '#ff0000',
    changes: undefined,
  });
});
test('old eyedropper must not overwrite a fresh component with the same ID', async () => {
  await start();
  act(() => w.session.render(<></>));
  expect(document.getElementById('shad-color1')).toBeNull();
  await mount();
  await w.act('setColor', '#0000ff');
  expect(document.getElementById('shad-color1')).toHaveTextContent('#0000ff');
  await finish();
  expect({
    value: w.exposed().value,
    visible: document.getElementById('shad-color1').textContent,
    changes: w.variables().changes,
  }).toEqual({ value: '#0000ff', visible: '#0000ff', changes: undefined });
});
test('cancelled old operation after unmount does not publish or fire', async () => {
  await start();
  act(() => w.session.render(<></>));
  await act(async () => rejectPick(new DOMException('Cancelled', 'AbortError')));
  expect({ value: w.exposed().value, changes: w.variables().changes }).toEqual({
    value: '#ff0000',
    changes: undefined,
  });
});
