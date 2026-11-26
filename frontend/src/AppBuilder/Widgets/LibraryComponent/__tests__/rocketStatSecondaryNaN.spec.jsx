import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-265): Set secondary value with {{NaN}} exposed and showed NaN on a Rocket 2.0 Stat; Set primary value with NaN
// gives empty. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Rocket Stat: Set secondary value with NaN is empty', () => {
  test('[PackComponent-STAT-SEC-001] NaN exposes an empty secondary value', async () => {
    const v = await mountPack('shadcn', 'Stat', {});
    await v.run('setSecondaryValue', NaN);
    expect(v.exposed.secondaryValue).toBe('');
  });

  test('[PackComponent-STAT-SEC-002] Infinity exposes an empty secondary value', async () => {
    const v = await mountPack('shadcn', 'Stat', {});
    await v.run('setSecondaryValue', Infinity);
    expect(v.exposed.secondaryValue).toBe('');
  });

  test('[PackComponent-STAT-SEC-003] control: a figure such as 12.5 is still set', async () => {
    const v = await mountPack('shadcn', 'Stat', {});
    await v.run('setSecondaryValue', 12.5);
    expect(v.exposed.secondaryValue).toBe('12.5');
  });
});
