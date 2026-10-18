import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  GEOCODE_MAX_ANSWER_BYTES,
  GEOCODE_TIMEOUT_MS,
  GeocoderAnswerTooLarge,
  geocode,
} from '@/AppBuilder/Widgets/Ui2/Map/mapLayers';
import { PLACE_LABEL_MAX, parsePlaces } from '@/AppBuilder/Widgets/Ui2/Map/mapGeocoding';

// The geocoder client: one request a second for every map on the page, answers kept by URL. The client keeps its queue
// and answers for the whole page, so every test has its own endpoint and a clock far from the others.
let serial = 0;
let endpoint;
let calls;
const realFetch = global.fetch;
const answer = (url) => ({
  ok: true,
  json: async () => [{ lat: '12', lon: '22', display_name: new URL(url).searchParams.get('q') }],
});
const tick = (ms) => jest.advanceTimersByTimeAsync(ms);
const lookup = (query, signal) => geocode(endpoint, { query }, signal);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(1900000000000 + ++serial * 10000000));
  endpoint = `https://geo.example/client-${serial}?q={query}`;
  calls = [];
  global.fetch = jest.fn(async (url, options) => {
    calls.push({ url, at: Date.now(), options });
    return answer(url);
  });
});
afterEach(() => {
  global.fetch = realFetch;
  jest.useRealTimers();
});

describe('geocoder client', () => {
  it('keeps distinct lookups in order, at least 1.1 s apart', async () => {
    const work = ['Alpha', 'Beta'].map((q) => lookup(q));
    await tick(3000);
    expect((await Promise.all(work)).map((a) => a[0].label)).toEqual(['Alpha', 'Beta']);
    expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(1100);
  });

  it('answers identical lookups made while one is running from that one request', async () => {
    // Release audit: five setPickedLocation calls on one spot made five requests, 4.4 s of queued work.
    const work = Array.from({ length: 5 }, () => lookup('Same address'));
    await tick(6000);
    expect((await Promise.all(work)).every((a) => a[0].label === 'Same address')).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('keeps a shared request for the callers still waiting when one of them stops waiting', async () => {
    const leaving = new AbortController();
    const first = lookup('Shared', leaving.signal);
    const second = lookup('Shared');
    leaving.abort();
    await tick(10);
    expect(await first).toBeNull();
    expect((await second)[0].label).toBe('Shared');
    expect(calls[0].options.signal.aborted).toBe(false);
  });

  it('cancels a request once every caller stops waiting, and the next lookup runs', async () => {
    global.fetch = jest.fn((url, options) => {
      calls.push({ url, at: Date.now(), options });
      if (url.includes('Slow')) {
        return new Promise((resolve, reject) =>
          options.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')))
        );
      }
      return Promise.resolve(answer(url));
    });
    const a = new AbortController();
    const b = new AbortController();
    const slow = [lookup('Slow', a.signal), lookup('Slow', b.signal)];
    await tick(1);
    const next = lookup('Next');
    a.abort();
    expect(calls[0].options.signal.aborted).toBe(false);
    b.abort();
    expect(calls[0].options.signal.aborted).toBe(true);
    await tick(2500);
    expect(await Promise.all(slow)).toEqual([null, null]);
    expect((await next)[0].label).toBe('Next');
  });

  it('gives up on a geocoder that does not answer, and the queue moves on', async () => {
    // A request that never settled held the one-a-second queue for every map on the page.
    global.fetch = jest.fn((url, options) => {
      calls.push({ url, at: Date.now(), options });
      if (url.includes('Hang')) {
        return new Promise((resolve, reject) =>
          options.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')))
        );
      }
      return Promise.resolve(answer(url));
    });
    const hung = lookup('Hang').catch((error) => error);
    const next = lookup('After');
    await tick(GEOCODE_TIMEOUT_MS + 2000);
    expect(await hung).toBeInstanceOf(Error);
    expect((await next)[0].label).toBe('After');
    // A failed answer is not kept: asked again, it is requested again.
    const again = lookup('Hang').catch((error) => error);
    await tick(1200);
    expect(calls.filter((c) => c.url.includes('Hang'))).toHaveLength(2);
    await tick(GEOCODE_TIMEOUT_MS);
    await again;
  });

  it('answers a repeated lookup from the kept answer, and never fetches for a caller that already stopped', async () => {
    const first = lookup('Kept');
    await tick(1);
    expect((await first)[0].label).toBe('Kept');
    expect((await lookup('Kept'))[0].label).toBe('Kept');
    const gone = new AbortController();
    gone.abort();
    const skipped = lookup('Never', gone.signal);
    await tick(2000);
    expect(await skipped).toBeNull();
    expect(calls.map((c) => c.url)).toHaveLength(1);
  });

  it('refuses an answer larger than GEOCODE_MAX_ANSWER_BYTES, read or declared, and the queue moves on', async () => {
    // Release audit 2: a geocoder answer was read and parsed whole, whatever its size.
    const big = JSON.stringify([{ lat: '1', lon: '2', display_name: 'x'.repeat(GEOCODE_MAX_ANSWER_BYTES) }]);
    global.fetch = jest.fn(async (url, options) => {
      calls.push({ url, at: Date.now(), options });
      if (url.includes('Streamed')) return new Response(big);
      if (url.includes('Declared'))
        return new Response('[]', { headers: { 'content-length': String(GEOCODE_MAX_ANSWER_BYTES + 1) } });
      return answer(url);
    });
    const streamed = lookup('Streamed').catch((error) => error);
    const declared = lookup('Declared').catch((error) => error);
    const next = lookup('Small');
    await tick(4000);
    expect(await streamed).toBeInstanceOf(GeocoderAnswerTooLarge);
    expect(await declared).toBeInstanceOf(GeocoderAnswerTooLarge);
    expect((await next)[0].label).toBe('Small');
  });
});

describe('places from an answer', () => {
  it('shortens a label longer than PLACE_LABEL_MAX, with an ellipsis that shows it was shortened', () => {
    const [place] = parsePlaces([{ lat: '1', lon: '2', display_name: 'Pier 39, '.repeat(100) }]);
    expect(place.label).toHaveLength(PLACE_LABEL_MAX);
    expect(place.label.endsWith('…')).toBe(true);
    expect(parsePlaces([{ lat: '1', lon: '2', display_name: 'Pier 39' }])[0].label).toBe('Pier 39');
  });
});

describe('a caller that stopped waiting', () => {
  it('gets null even when the answer is kept, as it does when it is not', async () => {
    // Release audit round 2: an aborted call returned a kept answer, though an aborted call that would fetch got null.
    const warm = lookup('Kept');
    await tick(10);
    expect((await warm)[0].label).toBe('Kept');
    const gone = new AbortController();
    gone.abort();
    expect(await lookup('Kept', gone.signal)).toBeNull();
    expect(await lookup('Unkept', gone.signal)).toBeNull();
    expect(calls).toHaveLength(1);
  });
});
