import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

installBrowserStubs();

// QA (PF-264): a Rocket 2.0 Stat whose Value is {{Infinity}} (arithmetic on data not loaded, like 1/0) showed the word
// Infinity; NaN, null and empty show a dash. The pack component, the inline SDK and the host renderer are the real
// ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// What the Stat shows and exposes for a Value, as the host converts it before the Stat sees it.
const statFor = async (value) => {
  const { props } = typedPackProps('shadcn', 'Stat', [{ name: 'value', type: 'string' }], { value });
  const v = await mountPack('shadcn', 'Stat', props);
  return { shown: v.root().querySelector('.ui-stat-value').textContent, exposed: v.exposed.primaryValue };
};

describe('Rocket Stat: an Infinity Value shows a dash', () => {
  test('[PackComponent-STAT-INF-001] Infinity shows a dash and exposes empty', async () => {
    expect(await statFor(Infinity)).toEqual({ shown: '–', exposed: '' });
  });

  test('[PackComponent-STAT-INF-002] -Infinity shows a dash and exposes empty', async () => {
    expect(await statFor(-Infinity)).toEqual({ shown: '–', exposed: '' });
  });

  test('[PackComponent-STAT-INF-003] control: NaN already shows a dash', async () => {
    expect(await statFor(NaN)).toEqual({ shown: '–', exposed: '' });
  });
});
