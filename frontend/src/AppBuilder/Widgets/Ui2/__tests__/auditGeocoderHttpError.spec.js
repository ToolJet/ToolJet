// Release audit round 4 (Codex fixture reviewGeocoderHttpBodyCleanup, trimmed): a geocoder answering with an HTTP error
// was refused without cancelling its body, so an error body still streaming went on downloading after the search had
// already said it failed. It is now cancelled, as an oversized answer's is (auditGeocoderOversize); a good answer still
// reads to the end (the control).
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { ReadableStream } from 'stream/web';
import { geocode } from '@/AppBuilder/Widgets/Ui2/Map/mapLayers';

const original = global.fetch;
let serial = 0;
beforeEach(() => {
  jest.useFakeTimers();
  // Past the shared one-request-a-second gap, and a new URL each time (answers are cached).
  jest.setSystemTime(2300000000000 + ++serial * 100000);
});
afterEach(() => {
  global.fetch = original;
  jest.useRealTimers();
});

const bytes = (text) => new TextEncoder().encode(text);

test.each([404, 429, 503])('an HTTP %s answer is refused and its unread body cancelled', async (status) => {
  const cancelled = jest.fn();
  // An error body that has started and not finished.
  const response = new Response(
    new ReadableStream({ start: (c) => c.enqueue(bytes('unfinished')), cancel: cancelled }),
    {
      status,
    }
  );
  let signal;
  global.fetch = jest.fn(async (url, opts) => {
    signal = opts.signal;
    return response;
  });
  const result = geocode(`https://geo.example/http-error-${serial}?q={query}`, { query: 'Alpha' }).catch((e) => e);
  await jest.advanceTimersByTimeAsync(1);
  expect((await result).message).toBe(`geocoder ${status}`);
  expect(jest.getTimerCount()).toBe(0);
  const released = signal.aborted || cancelled.mock.calls.length > 0;
  await response.body?.cancel().catch(() => {}); // the test's own stream never stays open, whatever the client did
  expect(released).toBe(true);
});

test('a good answer is read to the end and parsed, not cancelled (control)', async () => {
  const cancelled = jest.fn();
  const answer = bytes(JSON.stringify([{ lat: '12', lon: '22', display_name: 'Complete' }]));
  const response = new Response(
    new ReadableStream({
      start: (c) => {
        c.enqueue(answer);
        c.close();
      },
      cancel: cancelled,
    }),
    { status: 200 }
  );
  global.fetch = jest.fn(async () => response);
  const result = geocode(`https://geo.example/http-ok-${serial}?q={query}`, { query: 'Alpha' });
  await jest.advanceTimersByTimeAsync(1);
  expect((await result)[0].label).toBe('Complete');
  expect(response.bodyUsed).toBe(true);
  expect(cancelled).not.toHaveBeenCalled();
});
