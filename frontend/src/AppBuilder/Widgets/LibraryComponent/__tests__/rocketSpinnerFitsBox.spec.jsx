import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-262): a Rocket 2.0 Spinner of Size 200 in an 80px box was drawn at 200px and cut off; Circular Progress and
// Avatar shrink to their box. The pack component, the inline SDK and the host renderer are the real ones; only module
// and CSS loading is replaced, and the box is given QA's size.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const BOX = { width: 240, height: 80 };
const realClient = {
  w: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth'),
  h: Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight'),
};
beforeEach(() => {
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => BOX.width });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => BOX.height });
});
afterEach(() => {
  Object.defineProperty(Element.prototype, 'clientWidth', realClient.w);
  Object.defineProperty(Element.prototype, 'clientHeight', realClient.h);
  document.body.innerHTML = '';
});

// The ring's drawn size for a Size, in the 240 x 80 box.
const drawn = async (props) => {
  const v = await mountPack('shadcn', 'Spinner', props);
  return Number(v.root().querySelector('.ui2-spinner-ring').getAttribute('width'));
};

describe('Rocket Spinner: a large spinner fits its box', () => {
  test('[PackComponent-SPINNER-FIT-001] Size 200 in an 80px box is drawn no taller than the box', async () => {
    expect(await drawn({ size: '200', label: '' })).toBeLessThanOrEqual(BOX.height);
  });

  test('[PackComponent-SPINNER-FIT-002] with the label below, the spinner leaves room for it', async () => {
    expect(await drawn({ size: '200', labelPosition: 'bottom' })).toBeLessThanOrEqual(BOX.height - 20);
  });

  test('[PackComponent-SPINNER-FIT-003] control: a Size that fits is drawn as set', async () => {
    expect(await drawn({ size: '24' })).toBe(24);
  });
});
