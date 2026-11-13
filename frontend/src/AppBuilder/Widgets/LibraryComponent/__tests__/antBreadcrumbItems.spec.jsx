import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA AD-44: an Ant Design Breadcrumb bound to [null, 1, {}, '', 'x', 'y'] drew an empty crumb for each bad item, five
// separators around the two real crumbs. The Menu, which QA held up as the control, left out null, 1 and {} but drew an
// empty item for ''. The pack's components, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const BAD_ITEMS = [null, 1, {}, '', 'x', 'y'];
const texts = (root, selector) => [...root.querySelectorAll(selector)].map((e) => e.textContent);

describe('Ant Design Breadcrumb and Menu: items with no text', () => {
  test('[PackComponent-CRUMBS-001] Breadcrumb leaves out null, a number, {} and blank text: x / y with one separator', async () => {
    const v = await mountPack('antd', 'Breadcrumb', { items: BAD_ITEMS });

    expect(texts(v.root(), '.ant-breadcrumb-link')).toEqual(['x', 'y']);
    expect(v.root().querySelectorAll('.ant-breadcrumb-separator')).toHaveLength(1);
    // x links back; y, the last crumb, is the current page.
    expect(texts(v.root(), '.ant-breadcrumb-link a')).toEqual(['x']);
  });

  test('[PackComponent-CRUMBS-002] Menu leaves out blank text as it leaves out null, a number and {}', async () => {
    const v = await mountPack('antd', 'Menu', { items: BAD_ITEMS });

    expect(texts(v.root(), '.ant-menu-item')).toEqual(['x', 'y']);
  });
});
