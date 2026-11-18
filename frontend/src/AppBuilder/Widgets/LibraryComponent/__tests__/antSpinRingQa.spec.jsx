import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Spin and Circular Progress. The pack's components, the inline SDK and
// the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

const root = (v) => v.root().querySelector('.tj-ant-root');
const STYLED = { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 20 };

// PKB-41: Container background, Border color and Border radius did nothing on a Spin or a Circular Progress: neither
// has a surface of its own for Ant to draw them on. Set, they draw the widget's box: its fill, a 1px border and its
// corners; unset, the box stays bare.
describe.each(['Spin', 'CircularProgress'])('Ant Design %s: box Styles', (name) => {
  test(`[PackComponent-${name === 'Spin' ? 'SPIN' : 'RING'}-001] Container background, Border color and Border radius draw the box`, async () => {
    const v = await mountPack('antd', name, {}, { styles: STYLED });

    expect(root(v).style.backgroundColor).toBe('rgb(255, 238, 170)');
    expect(root(v).style.border).toMatch(/1px solid (#0000ff|rgb\(0, 0, 255\))/);
    expect(root(v).style.borderRadius).toBe('20px');
  });

  test(`[PackComponent-${name === 'Spin' ? 'SPIN' : 'RING'}-002] each draws on its own`, async () => {
    const bg = await mountPack('antd', name, {}, { styles: { colorBgContainer: '#ffeeaa' } });
    const border = await mountPack('antd', name, {}, { styles: { colorBorder: '#0000ff' } });
    const radius = await mountPack('antd', name, {}, { styles: { borderRadius: 0 } });

    expect(root(bg).style.backgroundColor).toBe('rgb(255, 238, 170)');
    expect(root(bg).style.border).toBe('');
    expect(root(border).style.border).toMatch(/1px solid/);
    expect(root(border).style.backgroundColor).toBe('');
    expect(root(radius).style.borderRadius).toBe('0px');
  });

  test(`[PackComponent-${name === 'Spin' ? 'SPIN' : 'RING'}-003] left unset, the box stays bare`, async () => {
    const v = await mountPack('antd', name, {});

    expect(root(v).style.backgroundColor).toBe('');
    expect(root(v).style.border).toBe('');
    expect(root(v).style.borderRadius).toBe('');
  });
});

// PF-224: a long Tip wrapped under the spinner and ran a few px below a short box, where the host cut it off. The Spin
// now scrolls what does not fit, from the top (centred, the top of a tall tip would be out of reach above the box).
describe('Ant Design Spin with a long Tip in a short box', () => {
  const LONG = 'Loading the quarterly sales report for every region in the workspace, this can take a little while';

  test('[PackComponent-SPIN-004] the Spin scrolls a tip taller than the box, its top in reach', async () => {
    // Break this catches: the tip drawn past the bottom of the box, which cuts it off unscrollable.
    const v = await mountPack('antd', 'Spin', { tip: LONG });
    const copy = copyWithPackCss(v.root());
    const spinRoot = copy.querySelector('.tj-ant-root');

    expect(getComputedStyle(spinRoot).overflow).toBe('auto');
    expect(getComputedStyle(spinRoot).height).toBe('100%');
    // Centred by auto margins, which give way when the content is taller than the box, not by align-items.
    expect(getComputedStyle(copy.querySelector('.tj-ant-spin')).marginTop).toBe('auto');
  });
});

// PF-215: a long Label under the ring ran past the bottom of a short box, where the host cut it off, and the box did
// not scroll. The Circular Progress now scrolls what does not fit, as the ToolJet Text does.
describe('Ant Design Circular Progress with a long Label in a short box', () => {
  const LONG = 'Lorem ipsum dolor sit amet consectetur adipiscing elit '.repeat(6);

  test('[PackComponent-RING-004] the widget scrolls a label taller than the box', async () => {
    // Break this catches: the label drawn past the bottom of the box, which cuts it off unscrollable.
    const v = await mountPack('antd', 'CircularProgress', { label: LONG });
    const ringRoot = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(ringRoot).overflow).toBe('auto');
    expect(getComputedStyle(ringRoot).height).toBe('100%');
  });
});
