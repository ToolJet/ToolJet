import { fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design Map QA queue (fix/ant-design-bugs-2.0). The pack's Map, the inline SDK and the host renderer are the real
// ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const mountMap = async () => {
  const v = await mountPack('antd', 'Map', {
    data: [{ id: 1, name: 'A', lat: 37.78, lng: -122.41 }],
    clusterMarkers: false,
  });
  await waitFor(() => expect(v.root().querySelector('.leaflet-marker-icon')).toBeTruthy());
  return v;
};
const focused = (v) => v.root().activeElement;
const popups = (v) => v.root().querySelectorAll('.leaflet-popup').length;

describe('Ant Design Map: a marker opened from the keyboard', () => {
  // Break this catches: opening the popup redraws the selected marker as a new element, so the focus drops to the page
  // and Escape no longer reaches the marker: the popup stays open and the keyboard user loses their place (QA PF-242).
  test('[PackComponent-ANTMAP-001] the marker keeps the focus after Enter, and Escape then closes the popup', async () => {
    const v = await mountMap();
    const marker = v.root().querySelector('.leaflet-marker-icon');
    marker.focus();
    expect(focused(v)).toBe(marker);

    fireEvent.keyDown(marker, { key: 'Enter' });
    await settle();
    expect(popups(v)).toBe(1);
    expect(focused(v)?.classList.contains('leaflet-marker-icon')).toBe(true);

    fireEvent.keyDown(focused(v), { key: 'Escape' });
    await settle();
    expect(popups(v)).toBe(0);
    expect(focused(v)?.classList.contains('leaflet-marker-icon')).toBe(true);
  });
});
