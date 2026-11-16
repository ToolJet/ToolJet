import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Heading's Letter spacing of 0 (or 0px) left the level's tight default tracking (-0.025em, -0.75px
// at h2) in place, so tight tracking could not be turned off; 8px applied. The pack component, the inline SDK and the
// host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const headingSpacing = async (letterSpacing) => {
  const v = await mountPack('shadcn', 'Heading', { text: 'Title', level: 'h2' }, { styles: { letterSpacing } });
  return v.root().querySelector('.ui2-heading').style.letterSpacing;
};

describe('Rocket Heading: Letter spacing', () => {
  test.each([
    ['the number 0', 0],
    ['the text 0', '0'],
    ['0px', '0px'],
  ])('[PackComponent-HEADING-LS-001] %s sets no tracking, overriding the level default', async (_label, value) => {
    expect(await headingSpacing(value)).toBe('0px');
  });

  test('[PackComponent-HEADING-LS-002] left empty, the level keeps its own tracking', async () => {
    expect(await headingSpacing('')).toBe('');
  });

  test('[PackComponent-HEADING-LS-003] 8px sets 8px', async () => {
    expect(await headingSpacing('8px')).toBe('8px');
  });
});
