// Release audit round 4 (Codex fixture auditMapReverseSelectionGeneration, trimmed): an address lookup started by
// setPickedLocation answered after the user had chosen a search result at the same spot, and its address replaced the
// one the user chose. Matching coordinates were taken as leave to write; only the current selection's lookup may now
// name it. The controls (a result chosen elsewhere, a clear, an unmount) already held.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadMap',
  id: 'map1',
  handle: 'map1',
  widgetWidth: 600,
  widgetHeight: 424,
});
const original = global.fetch;
let requests;
let serial = 0;
beforeEach(() => {
  w.setup();
  requests = [];
  serial += 1;
  // Each request waits for the test to answer it, and fails when it is cancelled, as fetch does.
  global.fetch = jest.fn(
    (url, options) =>
      new Promise((resolve, reject) => {
        requests.push({ url, options, resolve });
        options.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), {
          once: true,
        });
      })
  );
});
afterEach(async () => {
  w.teardown();
  await act(async () => {});
  global.fetch = original;
});

const answer = (request, label, lat, lng) =>
  act(async () =>
    request.resolve({ ok: true, json: async () => [{ lat: String(lat), lon: String(lng), display_name: label }] })
  );

test.each(['the same spot', 'another spot', 'then cleared', 'then unmounted'])(
  'an older address lookup cannot rename a search result chosen at %s',
  async (mode) => {
    const [lat, lng] = mode === 'another spot' ? [32, 42] : [12, 22];
    const chosen = { lat, lng, address: 'Chosen place' };
    w.render({
      currentMode: 'view',
      properties: {
        data: binding('{{[]}}'),
        showSearch: binding('{{true}}'),
        pickLocation: binding('{{true}}'),
        fitToMarkers: binding('{{false}}'),
        geocoderUrl: binding(`https://geo.example/reverse-selection-${serial}/search?q={query}`),
        reverseGeocoderUrl: binding(`https://geo.example/reverse-selection-${serial}/reverse?lat={lat}&lon={lng}`),
      },
    });
    w.setEvents(
      setVariableOn('map1', 'onLocationPicked', {
        key: 'picks',
        value: '{{[...(variables.picks || []), components.map1.pickedLocation]}}',
      })
    );
    await act(async () => fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'Alpha' } }));
    await waitFor(() => expect(requests).toHaveLength(1), { timeout: 4000 });
    await answer(requests[0], 'Chosen place', lat, lng);
    const suggestion = await screen.findByRole('button', { name: 'Chosen place' });

    // A quiet pick with no address starts a lookup, held unanswered while the user chooses the suggestion.
    await w.act('setPickedLocation', 12, 22);
    await waitFor(() => expect(requests).toHaveLength(2), { timeout: 4000 });
    expect(requests[1].url).toContain('/reverse?lat=12&lon=22');
    await act(async () => fireEvent.click(suggestion));
    await waitFor(() => expect(w.exposed().pickedLocation).toEqual(chosen));
    expect(w.variables().picks).toEqual([chosen]);

    if (mode === 'then cleared') await w.act('clearPickedLocation');
    if (mode === 'then unmounted') await act(async () => w.session.render(null));
    const before = w.exposed().pickedLocation;
    await answer(requests[1], 'Older lookup address', 12, 22);

    expect(w.variables().picks).toEqual([chosen]);
    expect(w.exposed().pickedLocation).toEqual(mode === 'then cleared' ? {} : before);
    if (mode !== 'then cleared' && mode !== 'then unmounted') expect(before).toEqual(chosen);
  },
  10000
);
