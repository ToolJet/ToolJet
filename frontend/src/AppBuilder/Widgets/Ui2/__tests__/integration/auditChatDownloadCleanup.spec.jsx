// Release audit round 3 (Codex fixture reviewChatDownloadCleanup, trimmed): when the download link's click threw, the
// Chat's downloadChat left its link in the page and its blob URL unreleased. Both go whether the click works or not.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act } from '@testing-library/react';
import { toast } from 'react-hot-toast';

const w = createWidgetHarness({
  componentType: 'ShadChat',
  id: 'chat1',
  handle: 'chat1',
  widgetWidth: 600,
  widgetHeight: 500,
});
const saved = {};
beforeEach(() => {
  w.setup();
  saved.create = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  saved.revoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
  for (const [key, name] of [
    ['create', 'createObjectURL'],
    ['revoke', 'revokeObjectURL'],
  ]) {
    if (saved[key]) Object.defineProperty(URL, name, saved[key]);
    else delete URL[name];
  }
  document.querySelectorAll('a[download]').forEach((a) => a.remove());
});

test.each(['works', 'throws'])('a download whose click %s leaves no link and releases its blob URL', async (mode) => {
  const revoke = jest.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:audit-download') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    if (mode === 'throws') throw new Error('injected download failure');
  });
  const failed = jest.spyOn(toast, 'error');
  await act(async () =>
    w.render({ currentMode: 'view', properties: { initialChat: binding('{{[{message:"Hello",type:"message"}]}}') } })
  );
  await w.act('downloadChat');
  expect(click).toHaveBeenCalledTimes(1);
  expect(revoke.mock.calls).toEqual([['blob:audit-download']]);
  expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  expect(failed).toHaveBeenCalledTimes(mode === 'throws' ? 1 : 0);
});
