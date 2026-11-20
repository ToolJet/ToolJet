import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design Link QA queue (fix/ant-design-bugs-1.0). The pack's Link, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced. jsdom lays nothing out, so these read the classes the pack's
// rules hang on, not colours.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const link = (v) => v.root().querySelector('.tj-ant-link');

describe('Ant Design Link: Disabled', () => {
  // Break this catches: the Link never reads its disabled state, so it keeps the link colour and the hand cursor.
  test('[PackComponent-ANTLINK-001] a disabled Link is drawn disabled; an enabled one is not', async () => {
    const off = await mountPack('antd', 'Link', { href: 'https://example.com' }, { host: { disabled: true } });
    await settle();
    expect(link(off).classList.contains('ant-typography-disabled')).toBe(true);
    expect(link(off).getAttribute('aria-disabled')).toBe('true');
    document.body.innerHTML = '';

    const on = await mountPack('antd', 'Link', { href: 'https://example.com' });
    await settle();
    expect(link(on).classList.contains('ant-typography-disabled')).toBe(false);
  });
});

describe('Ant Design Link: Text color, Container background, Border color, Border radius', () => {
  // Break this catches: the four styles change nothing on the Link. Each applies only when it is set.
  test('[PackComponent-ANTLINK-002] each style set marks the Link for its rule; none set leaves it plain', async () => {
    const styles = { colorText: '#dc2626', colorBgContainer: '#fde68a', colorBorder: '#2563eb', borderRadius: 20 };
    const styled = await mountPack('antd', 'Link', { href: 'https://example.com' }, { styles });
    await settle();
    const classes = link(styled).classList;
    expect(['has-text', 'has-bg', 'has-border', 'has-radius'].filter((c) => !classes.contains(c))).toEqual([]);
    document.body.innerHTML = '';

    const plain = await mountPack('antd', 'Link', { href: 'https://example.com' });
    await settle();
    const plainClasses = link(plain).classList;
    expect(['has-text', 'has-bg', 'has-border', 'has-radius'].filter((c) => plainClasses.contains(c))).toEqual([]);
  });
});
