// Release audit round 3 (Codex fixture reviewGeocoderOversizeCancellation, trimmed): a geocoder answer declaring a
// Content-Length over the limit was refused without cancelling its body, so the download went on unread. It is now
// cancelled, as an answer that streams past the limit already was (the control).
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { geocode, GEOCODE_MAX_ANSWER_BYTES } from '@/AppBuilder/Widgets/Ui2/Map/mapLayers';

const original = global.fetch;
let serial = 0;
beforeEach(() => {
  jest.useFakeTimers();
  // Past the shared one-request-a-second gap, and a new URL each time (answers are cached).
  jest.setSystemTime(2000000000000 + ++serial * 100000);
});
afterEach(() => {
  global.fetch = original;
  jest.useRealTimers();
});

test.each(['declared', 'streamed'])('an oversized (%s) answer is refused and its body cancelled', async (mode) => {
  const cancel = jest.fn(async () => {});
  const read = jest.fn(async () => ({ done: false, value: new Uint8Array(GEOCODE_MAX_ANSWER_BYTES + 1) }));
  let signal;
  global.fetch = jest.fn(async (url, opts) => {
    signal = opts.signal;
    return {
      ok: true,
      headers: { get: () => (mode === 'declared' ? String(GEOCODE_MAX_ANSWER_BYTES + 1) : null) },
      body: { cancel, getReader: () => ({ read, cancel }) },
    };
  });
  const result = geocode(`https://geo.example/oversize-${serial}?q={query}`, { query: 'A' }).catch((e) => e);
  await jest.advanceTimersByTimeAsync(1);
  expect((await result).name).toBe('GeocoderAnswerTooLarge');
  if (mode === 'declared') expect(read).not.toHaveBeenCalled();
  expect(signal.aborted || cancel.mock.calls.length > 0).toBe(true);
});
