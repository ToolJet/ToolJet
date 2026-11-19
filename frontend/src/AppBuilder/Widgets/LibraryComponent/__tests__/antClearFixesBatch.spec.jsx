import { fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK_CSS = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8');
const ruleOf = (selector) => {
  const at = PACK_CSS.indexOf(`${selector} {`);
  return at === -1 ? '' : PACK_CSS.slice(at, PACK_CSS.indexOf('}', at));
};
const rootOf = (v) => v.root().querySelector('.tj-ant-root');

// QA PF-223: Rows bound to {{12345678901234}} reached Ant, which drew nothing building that many rows. Rows now keeps to
// its declared 0 to 20.
test('PF-223: Skeleton with a huge Rows draws at most 20 rows', async () => {
  const v = await mountPack('antd', 'Skeleton', { rows: 12345678901234 });
  await waitFor(() => expect(v.root().querySelector('.ant-skeleton')).toBeTruthy());
  expect(v.root().querySelector('.tj-cc-error')).toBeNull();
  expect(v.root().querySelectorAll('.ant-skeleton-paragraph > li').length).toBeLessThanOrEqual(20);
});

// QA PF-276: the drag area kept Ant's light grey whatever Container background was; only the Button type took it.
test('PF-276: Upload drag area takes Container background, else Ant fill', () => {
  expect(ruleOf('.tj-ant-upload .ant-upload-drag')).toMatch(
    /background-color: var\(--tj-ant-color-bg-container, var\(--ant-color-fill-alter\)\)/
  );
});

// QA PF-211 / PF-212: a long Title or Text in a short box ran past its bottom with no scroll. Both now scroll inside the
// box with Dynamic height off (the shared fit-scroll rule).
test.each(['Title', 'Text'])('PF-211 / PF-212: a long %s scrolls inside a fixed box', async (name) => {
  const v = await mountPack('antd', name, { children: 'Lorem ipsum dolor sit amet '.repeat(12) });
  await waitFor(() => expect(rootOf(v)).toBeTruthy());
  expect(rootOf(v).classList.contains('tj-ant-fit-scroll')).toBe(true);
  const rule = ruleOf('.tj-cc-root:not(.tj-cc-fit) > .tj-ant-fit-scroll');
  expect(rule).toMatch(/height: 100%/);
  expect(rule).toMatch(/overflow: auto/);
});

// QA PF-194: the default picture is 100px and ran 35px out of a 60px box. It now shrinks to the room the text leaves
// (jsdom has no layout: the oracle is the rules; checked in Chrome: 30px in a 60px box, 100px in a 200px one).
test('PF-194: the Empty picture shrinks in a short box', async () => {
  const v = await mountPack('antd', 'Empty', { image: 'default' });
  await waitFor(() => expect(v.root().querySelector('.ant-empty-image')).toBeTruthy());
  expect(rootOf(v).classList.contains('tj-ant-empty')).toBe(true);
  expect(ruleOf('.tj-ant-empty .ant-empty')).toMatch(/max-height: 100%/);
  const image = ruleOf('.tj-ant-empty .ant-empty-image');
  expect(image).toMatch(/flex: 0 1 auto/);
  expect(image).toMatch(/min-height: 0/);
});

// QA PF-242: a focused marker took no Enter or Space (Leaflet's own keys open only a bindPopup popup).
describe('PF-242: Map marker keys', () => {
  const mountMap = async () => {
    const v = await mountPack('antd', 'Map', {
      data: [{ id: 1, name: 'A', lat: 37.78, lng: -122.41 }],
      clusterMarkers: false,
    });
    await waitFor(() => expect(v.root().querySelector('.leaflet-marker-icon')).toBeTruthy());
    return v;
  };
  test.each(['Enter', ' '])('%p on a focused marker clicks it', async (key) => {
    const v = await mountMap();
    fireEvent.keyDown(v.root().querySelector('.leaflet-marker-icon'), { key });
    await settle();
    expect(v.events).toContain('onMarkerClick');
  });
  test('other keys do not', async () => {
    const v = await mountMap();
    fireEvent.keyDown(v.root().querySelector('.leaflet-marker-icon'), { key: 'ArrowDown' });
    fireEvent.keyDown(v.root().querySelector('.leaflet-marker-icon'), { key: 'Escape' });
    await settle();
    expect(v.events).not.toContain('onMarkerClick');
  });
});
