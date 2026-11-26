import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

installBrowserStubs();

// QA (PF-168): a Rocket 2.0 Rating whose Default value is text such as abc exposed null; the native Star Rating and the
// Rocket Slider expose 0. The host hands a number property that isn't a number to the component as null. The pack
// component, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The rating exposed for a Default value, as the host converts it before the Rating sees it.
const exposedFor = async (defaultValue) => {
  const { props } = typedPackProps('shadcn', 'Rating', [{ name: 'defaultValue', type: 'number' }], { defaultValue });
  const v = await mountPack('shadcn', 'Rating', props);
  return v.exposed.value;
};

describe('Rocket Rating: a Default value that is not a number exposes 0', () => {
  test('[PackComponent-RATING-DEF-001] text such as abc exposes 0', async () => {
    expect(await exposedFor('abc')).toBe(0);
  });

  test('[PackComponent-RATING-DEF-002] an empty Default value exposes 0', async () => {
    expect(await exposedFor('')).toBe(0);
  });

  test('[PackComponent-RATING-DEF-003] control: 3.7 still rounds to 4', async () => {
    expect(await exposedFor(3.7)).toBe(4);
  });
});
