// Release audit round 4 (Codex fixtures auditMapProviderRefreshWidget and auditMapProviderRefreshOwnership, trimmed):
// after geocoderUrl changed, a search answer from the old geocoder, still on its way or already listed, stayed on offer,
// and choosing it set pickedLocation and fired onLocationPicked. Places were matched to their query only; they now
// belong to the geocoder that found them too. Likewise an address lookup on the old reverseGeocoderUrl no longer names
// the picked spot. The controls (same geocoder, unmount) already held.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
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
        requests.push({ url, options, resolve, answered: false });
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

// Two app geocoders, both searched as you type, so only the URL changes.
const geocoder = (name) => `https://geo.example/provider-${serial}-${name}?q={query}`;
const reverseGeocoder = (name) => `https://geo.example/provider-${serial}-${name}?lat={lat}&lon={lng}`;
const picks = () => w.variables().picks;
const answer = async (request, label, [lat, lng] = [12, 22]) => {
  request.answered = true;
  await act(async () =>
    request.resolve({ ok: true, json: async () => [{ lat: String(lat), lon: String(lng), display_name: label }] })
  );
};

const searchAlphaOnA = async () => {
  w.render({
    currentMode: 'view',
    properties: {
      data: binding('{{[]}}'),
      showSearch: binding('{{true}}'),
      pickLocation: binding('{{true}}'),
      fitToMarkers: binding('{{false}}'),
      geocoderUrl: binding(geocoder('A')),
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
  expect(requests[0].url).toContain('-A?q=Alpha');
};

const switchToB = async () => {
  w.setComponentProperty('map1', 'geocoderUrl', geocoder('B'), 'properties');
  await waitFor(() =>
    expect(useStore.getState().getResolvedComponent('map1', undefined, 'canvas').properties.geocoderUrl).toBe(
      geocoder('B')
    )
  );
};

// B may be asked again for the query; it answers with its own place.
const expectOnlyBOffered = async () => {
  await waitFor(
    () => {
      requests
        .filter((r) => r.url.includes('-B?') && !r.answered)
        .forEach((r) => {
          r.answered = true;
          r.resolve({ ok: true, json: async () => [{ lat: '32', lon: '42', display_name: 'Place from B' }] });
        });
      expect(document.querySelector('.sc-map-search-spin')).toBeNull();
    },
    { timeout: 4000 }
  );
  expect(screen.queryByRole('button', { name: 'Place from A' })).toBeNull();
  expect(picks()).toBeUndefined();
};

test('with the geocoder unchanged, its place is offered and chosen (control)', async () => {
  await searchAlphaOnA();
  await answer(requests[0], 'Place from A');
  await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Place from A' })));
  await waitFor(() => expect(w.exposed().pickedLocation).toEqual({ lat: 12, lng: 22, address: 'Place from A' }));
  expect(picks()).toEqual([{ lat: 12, lng: 22, address: 'Place from A' }]);
}, 10000);

test('an answer still on its way from the old geocoder is not offered', async () => {
  await searchAlphaOnA();
  await switchToB();
  await answer(requests[0], 'Place from A');
  await expectOnlyBOffered();
}, 10000);

test('places the old geocoder already listed are withdrawn', async () => {
  await searchAlphaOnA();
  await answer(requests[0], 'Place from A');
  await screen.findByRole('button', { name: 'Place from A' });
  await switchToB();
  await expectOnlyBOffered();
}, 10000);

test('unmounting cancels the search on its way (control)', async () => {
  await searchAlphaOnA();
  await act(async () => w.session.render(null));
  expect(requests[0].options.signal.aborted).toBe(true);
  await answer(requests[0], 'Place from A');
  expect(document.querySelector('.sc-map-canvas')).toBeNull();
  expect(picks()).toBeUndefined();
}, 10000);

test('an address lookup still on its way from the old reverse geocoder does not name the picked spot', async () => {
  w.render({
    currentMode: 'view',
    properties: {
      data: binding('{{[]}}'),
      pickLocation: binding('{{true}}'),
      fitToMarkers: binding('{{false}}'),
      reverseGeocoderUrl: binding(reverseGeocoder('A')),
    },
  });
  await w.act('setPickedLocation', 12, 22);
  await waitFor(() => expect(requests).toHaveLength(1), { timeout: 4000 });
  expect(requests[0].url).toContain('-A?lat=12&lon=22');
  w.setComponentProperty('map1', 'reverseGeocoderUrl', reverseGeocoder('B'), 'properties');
  await waitFor(() =>
    expect(useStore.getState().getResolvedComponent('map1', undefined, 'canvas').properties.reverseGeocoderUrl).toBe(
      reverseGeocoder('B')
    )
  );
  await answer(requests[0], 'Address from A');
  expect(w.exposed().pickedLocation).toEqual({ lat: 12, lng: 22 });
}, 10000);
