import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-160): Tab into a Rocket 2.0 Carousel focuses the carousel itself, where Enter and Space did nothing, so On
// slide clicked needed a mouse (the slide is only the next Tab stop). The pack component, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const carousel = async () => {
  const v = await mountPack('shadcn', 'Carousel', {});
  const region = v.root().querySelector('[role="region"]');
  region.focus();
  return { v, region };
};
const fired = (v, name) => v.events.filter((e) => String(e?.name ?? e) === name).length;

describe('Rocket Carousel: Enter and Space on the focused carousel click the current slide', () => {
  test('[PackComponent-CAROUSEL-KEY-001] Enter and Space each fire On slide clicked once', async () => {
    const { v, region } = await carousel();
    fireEvent.keyDown(region, { key: 'Enter' });
    fireEvent.keyDown(region, { key: ' ' });
    expect(fired(v, 'onSlideClicked')).toBe(2);
    expect(v.exposed.clickedSlide?.index).toBe(0);
  });

  test('[PackComponent-CAROUSEL-KEY-002] control: ArrowRight still moves to the next slide without a click', async () => {
    const { v, region } = await carousel();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(fired(v, 'onSlideChanged')).toBe(1);
    expect(fired(v, 'onSlideClicked')).toBe(0);
  });
});
