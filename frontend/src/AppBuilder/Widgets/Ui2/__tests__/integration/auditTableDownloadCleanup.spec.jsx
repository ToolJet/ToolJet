// Release audit round 3: Codex's fixture reviewTableDownloadCleanup. Table: downloadTableData removes its link and frees
// its blob URL even when the browser refuses the download (the click throws).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'table1',
  handle: 'table1',
  widgetWidth: 800,
  widgetHeight: 400,
});
let create, revoke;
beforeEach(() => {
  w.setup();
  jest.useFakeTimers();
  create = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  revoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
});
afterEach(() => {
  w.teardown();
  jest.useRealTimers();
  jest.restoreAllMocks();
  if (create) Object.defineProperty(URL, 'createObjectURL', create);
  else delete URL.createObjectURL;
  if (revoke) Object.defineProperty(URL, 'revokeObjectURL', revoke);
  else delete URL.revokeObjectURL;
  document.querySelectorAll('a[download]').forEach((a) => a.remove());
});

test.each(['success', 'click-error'])('download cleans up its link and blob URL: %s', async (mode) => {
  const make = jest.fn(() => 'blob:table-audit');
  const release = jest.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: make });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: release });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    if (mode === 'click-error') throw Error('injected download failure');
  });
  w.render({
    currentMode: 'view',
    properties: { data: binding([{ id: 'A', name: 'Alpha' }]), columns: binding([{ key: 'name', name: 'Name' }]) },
  });
  let caught;
  try {
    await w.act('downloadTableData', 'csv');
  } catch (e) {
    caught = e;
  }
  if (mode === 'click-error') expect(caught?.message).toBe('injected download failure');
  else expect(caught).toBeUndefined();
  await act(async () => jest.advanceTimersByTime(1500));
  expect(make).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect({ released: release.mock.calls, links: document.querySelectorAll('a[download]').length }).toEqual({
    released: [['blob:table-audit']],
    links: 0,
  });
});
