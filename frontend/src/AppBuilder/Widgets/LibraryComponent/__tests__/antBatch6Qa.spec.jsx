import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design. The pack's components, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

// The declarations pack.css gives a selector, read off its rules.
const rule = (selector) => {
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  document.head.appendChild(style);
  const found = [...style.sheet.cssRules].find((r) => r.selectorText === selector);
  style.remove();
  return found?.style;
};

// PKB-41: Primary color did nothing on a Statistic (a red and a green one drew the same). It colours the figure; unset,
// the figure keeps Ant's heading colour (which Text color sets).
test('[PackComponent-STATISTIC-010] Primary color colours the figure', () => {
  expect(rule('.tj-ant-stat .ant-statistic-content').color).toBe(
    'var(--tj-ant-color-primary, var(--ant-color-text-heading))'
  );
});

// PKB-41: Container background, Border color and Border radius did nothing on a Switch. They fill, frame and round the
// widget's box, as on the Spin and the plain Icon; unset, the box stays bare.
describe('Ant Design Switch: Styles', () => {
  const root = (v) => v.root().querySelector('.tj-ant-root');

  test('[PackComponent-SWITCH-010] Container background, Border color and Border radius draw the box', async () => {
    const v = await mountPack(
      'antd',
      'Switch',
      { checked: true },
      { styles: { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 20 } }
    );

    expect(root(v).style.backgroundColor).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
    expect(root(v).style.border).toMatch(/#0000ff|rgb\(0, 0, 255\)/);
    expect(root(v).style.borderRadius).toBe('20px');
    // The label kept off the drawn edge.
    expect(root(v).style.paddingInline).toBe('8px');
  });

  test('[PackComponent-SWITCH-011] unset, the box has no colour, frame or corners of its own', async () => {
    const v = await mountPack('antd', 'Switch', { checked: true });

    expect(root(v).style.backgroundColor).toBe('');
    expect(root(v).style.border).toBe('');
    expect(root(v).style.borderRadius).toBe('');
    expect(root(v).style.paddingInline).toBe('');
  });
});
