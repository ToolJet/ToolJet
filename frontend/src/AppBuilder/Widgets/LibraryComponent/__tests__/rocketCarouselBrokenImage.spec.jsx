import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-159): a Rocket 2.0 Carousel slide whose image fails to load showed only an empty frame, with no title; a slide
// with no image shows its title. The pack component, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const slideText = (v, i) => v.root().querySelectorAll('.n2-carousel-slide')[i].textContent;

describe('Rocket Carousel: a slide whose image fails still shows its text', () => {
  test('[PackComponent-CAROUSEL-IMG-001] a broken image keeps the title and description', async () => {
    const slides = [{ image: 'https://example.invalid/x.png', title: 'Broken', description: 'Still here' }];
    const v = await mountPack('shadcn', 'Carousel', { slides });
    await act(async () => fireEvent.error(v.root().querySelector('.n2-carousel-slide img')));
    expect(v.root().querySelector('.n2-carousel-slide img')).toBeNull();
    expect(slideText(v, 0)).toContain('Broken');
    expect(slideText(v, 0)).toContain('Still here');
  });

  test('[PackComponent-CAROUSEL-IMG-002] control: a slide with no image shows its title', async () => {
    const v = await mountPack('shadcn', 'Carousel', { slides: [{ title: 'NoImg' }] });
    expect(slideText(v, 0)).toContain('NoImg');
  });
});
