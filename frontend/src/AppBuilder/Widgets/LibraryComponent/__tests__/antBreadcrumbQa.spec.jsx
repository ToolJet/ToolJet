import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Breadcrumb. The pack's Breadcrumb, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

const declared = (selector, property) => {
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  document.head.appendChild(style);
  const rule = [...style.sheet.cssRules].find((r) =>
    (r.selectorText ?? '').split(',').some((s) => s.trim() === selector)
  );
  style.remove();
  return rule?.style.getPropertyValue(property) ?? '';
};
const root = (v) => v.root().querySelector('.tj-ant-root');

// PKB-41: Primary color, Container background and Border color did nothing on the Breadcrumb. Primary color now colours
// the crumbs that are links (Ant's description grey when unset); Container background, Border color and Border radius
// draw the widget box, as on the Spin.
describe('Ant Design Breadcrumb Styles', () => {
  test('[PackComponent-CRUMBS-003] Primary color colours the crumb links', async () => {
    const v = await mountPack('antd', 'Breadcrumb', {});

    expect(v.root().querySelector('.tj-ant-breadcrumb .ant-breadcrumb a')).toBeTruthy();
    expect(declared('.tj-ant-breadcrumb .ant-breadcrumb', '--ant-breadcrumb-link-color')).toBe(
      'var(--tj-ant-color-primary, var(--ant-color-text-description))'
    );
  });

  test('[PackComponent-CRUMBS-004] Container background and Border color draw the box', async () => {
    const v = await mountPack(
      'antd',
      'Breadcrumb',
      {},
      { styles: { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff' } }
    );

    expect(root(v).style.backgroundColor).toBe('rgb(255, 238, 170)');
    expect(root(v).style.border).toMatch(/1px solid (#0000ff|rgb\(0, 0, 255\))/);
  });

  test('[PackComponent-CRUMBS-005] left unset, the box stays bare', async () => {
    const v = await mountPack('antd', 'Breadcrumb', {});

    expect(root(v).style.backgroundColor).toBe('');
    expect(root(v).style.border).toBe('');
  });
});

// PKB-76: crumbs that did not fit a narrow box wrapped onto lines below it, where the host cut them off. The
// Breadcrumb now fills its box and scrolls them.
describe('Ant Design Breadcrumb in a narrow box', () => {
  test('[PackComponent-CRUMBS-006] the Breadcrumb fills the box and scrolls', async () => {
    const v = await mountPack('antd', 'Breadcrumb', {
      items: ['Home', 'Customers and accounts', 'Orders this quarter', 'Order 1042'],
    });
    const r = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(r).height).toBe('100%');
    expect(getComputedStyle(r).overflow).toBe('auto');
  });
});
