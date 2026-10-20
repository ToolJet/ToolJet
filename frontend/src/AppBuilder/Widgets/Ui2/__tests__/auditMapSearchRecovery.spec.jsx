import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture currentMapSearchRecovery016): after an Enter search failed, Enter again on the same
// address sent nothing, because it set the submitted query to the string it already held and no effect saw a change.
// Enter now starts a new search attempt (not while one is already running). The failure message also belonged only to
// the geocoder, so a failed query's message stayed up for the next query during its type-ahead pause; it now belongs
// to the query too. The controls (a first search that succeeds, a retry with a changed query) already held.
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MapSearch, useMapSearch } from '@/AppBuilder/Widgets/Ui2/Map/MapSearch';

const UNAVAILABLE = 'Search is unavailable right now';
const originalFetch = global.fetch;
let serial = 0;
let calls;
let live;
let state;
let pending;
const tick = async (ms) => act(async () => jest.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  jest.useFakeTimers();
  // Past the shared one-request-a-second gap, and a new URL each time (answers are cached).
  jest.setSystemTime(2300000000000 + ++serial * 10000000);
  calls = [];
  pending = null;
  global.fetch = jest.fn(async (url, options) => {
    calls.push({ url, aborted: options.signal.aborted });
    if (pending) await pending;
    if (calls.length === 1 && !url.includes('successful')) throw new TypeError('Synthetic temporary network failure');
    return { ok: true, json: async () => [{ lat: '12', lon: '22', display_name: 'Current place' }] };
  });
  live = { current: { geocoder: { search: `https://geo.example/recovery-${serial}?q={query}` }, pickLocation: true } };
});
// setupTests' afterEach puts real timers back before this file's afterEach runs, so each test checks for itself
// that unmounting leaves no timer behind.
afterEach(() => {
  global.fetch = originalFetch;
});
const unmountsClean = async () => {
  cleanup();
  await tick(0);
  expect(jest.getTimerCount()).toBe(0);
};

function Host({ typeAhead = false }) {
  state = useMapSearch({ live, mapRef: { current: null }, pick: () => {}, typeAhead });
  return <MapSearch search={state} disabled={false} placeholder="Find address" typeAhead={typeAhead} />;
}
const enter = () => fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter', code: 'Enter' });
const change = (q) => fireEvent.change(screen.getByRole('searchbox'), { target: { value: q } });

test('a successful Enter search offers its places (control)', async () => {
  live.current.geocoder.search = `https://geo.example/successful-${serial}?q={query}`;
  render(<Host />);
  change('Alpha');
  enter();
  await tick(1600);
  expect(calls).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Current place' })).toBeInTheDocument();
  await unmountsClean();
});

test.each([false, true])('Enter retries a failed search, query changed: %s', async (changedQuery) => {
  render(<Host />);
  change('Alpha');
  enter();
  await tick(1600);
  expect(calls).toHaveLength(1);
  expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  if (changedQuery) change('Beta');
  enter();
  await tick(3000);
  expect(calls).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Current place' })).toBeInTheDocument();
  await unmountsClean();
});

test('Enter while a search is running starts no second one', async () => {
  live.current.geocoder.search = `https://geo.example/successful-${serial}?q={query}`;
  let release;
  pending = new Promise((resolve) => (release = resolve));
  render(<Host />);
  change('Alpha');
  enter();
  await tick(0);
  expect(calls).toHaveLength(1);
  enter();
  enter();
  await tick(3000);
  expect(calls).toHaveLength(1);
  expect(calls[0].aborted).toBe(false);
  await act(async () => release());
  await tick(0);
  expect(screen.getByRole('button', { name: 'Current place' })).toBeInTheDocument();
  await unmountsClean();
});

test("a failed query's message is withdrawn as soon as the query changes", async () => {
  render(<Host typeAhead />);
  change('Alpha');
  await tick(1600);
  expect(calls).toHaveLength(1);
  expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  change('Beta');
  await tick(0);
  expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
  await unmountsClean();
});
