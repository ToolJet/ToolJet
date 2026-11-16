import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

installBrowserStubs();

// QA: a Rocket 2.0 Hero's Aside bound to {{1234567}} read 1234567, not 1,234,567 as Summary Strip formats its figures.
// The Hero formats a number, but the host turned the bound number into text before the Hero saw it: Aside took text or
// a list, not a number. The pack component, the inline SDK and the host renderer are the real ones; only module and
// CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const ASIDE = [{ name: 'asideValue', type: 'string' }];
// The Aside as the host hands it to the Hero.
const bound = (asideValue) => typedPackProps('shadcn', 'Hero', ASIDE, { asideValue }).props.asideValue;
const figure = async (asideValue) => {
  const v = await mountPack('shadcn', 'Hero', { asideValue: bound(asideValue), asideLabel: 'Visits' });
  return v.root().querySelector('.ui2-hero-figure')?.textContent;
};

describe('Rocket Hero: an Aside bound to a number', () => {
  test('[PackComponent-HERO-ASIDE-001] {{1234567}} reads 1,234,567', async () => {
    expect(await figure(1234567)).toBe('1,234,567');
  });

  test('[PackComponent-HERO-ASIDE-002] text stays as written: 98% and 1234567 typed as text', async () => {
    expect(await figure('98%')).toBe('98%');
    expect(await figure('1234567')).toBe('1234567');
  });

  test('[PackComponent-HERO-ASIDE-003] a list still draws facts', async () => {
    const v = await mountPack('shadcn', 'Hero', { asideValue: bound(['14 bookings', '3 need a reply']) });
    expect(v.root().querySelectorAll('[data-aside="facts"]')).toHaveLength(1);
  });
});
