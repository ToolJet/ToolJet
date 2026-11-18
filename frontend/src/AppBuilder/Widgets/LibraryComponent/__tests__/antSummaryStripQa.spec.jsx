import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Summary Strip. The pack's SummaryStrip, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

const twelve = Array.from({ length: 12 }, (_, i) => ({ label: `M${i}`, value: i * 100 }));

// PF-011: twelve items drew six and dropped the rest with no hint. The strip shows at most six, as the Rocket 2.0 strip
// it follows does; the Items help text now says so.
describe('Ant Design Summary Strip: more than six items', () => {
  test('[PackComponent-STRIP-001] the Items help text says only the first six are shown', async () => {
    const real = toolJetSdk.useStateArray;
    const declared = {};
    jest.spyOn(toolJetSdk, 'useStateArray').mockImplementation((options) => {
      declared[options.name] = options;
      return real(options);
    });
    const v = await mountPack('antd', 'SummaryStrip', { items: twelve });

    expect(v.root().querySelectorAll('.tj-ant-strip-item')).toHaveLength(6);
    expect(declared.items.description).toMatch(/first 6/i);
  });
});

// PF-012: a delta's green (and red) was Ant's status colour, 2.27:1 on white, too faint for text. Deltas are drawn in
// Ant's text shades of those colours (colorSuccessText, colorErrorText), derived for contrast with the surface; the
// Statistic's trend shares the rule.
describe('Summary Strip and Statistic delta colours', () => {
  const ruleColor = (selector) => {
    const style = document.createElement('style');
    style.textContent = ANT_PACK_CSS;
    document.head.appendChild(style);
    const rule = [...style.sheet.cssRules].find((r) => r.selectorText === selector);
    style.remove();
    return rule?.style.getPropertyValue('color');
  };

  test.each([
    ['.tj-ant-stat-change.is-up', 'var(--ant-color-success-text)'],
    ['.tj-ant-stat-change.is-down', 'var(--ant-color-error-text)'],
  ])('[PackComponent-STRIP-002] %s is drawn in %s', (selector, color) => {
    expect(ruleColor(selector)).toBe(color);
  });
});

// PKB-41: Primary color did nothing on the strip. Set, it colours the figures (each item's value); unset, they keep
// Ant's heading colour.
describe('Ant Design Summary Strip Primary color', () => {
  const figureColors = (v) => [...v.root().querySelectorAll('.ant-statistic-content')].map((e) => e.style.color);

  test('[PackComponent-STRIP-003] Primary color colours every figure', async () => {
    const v = await mountPack('antd', 'SummaryStrip', {}, { styles: { colorPrimary: '#ff0000' } });

    expect(figureColors(v).length).toBeGreaterThan(0);
    figureColors(v).forEach((c) => expect(c).toMatch(/#ff0000|rgb\(255, 0, 0\)/));
  });

  test('[PackComponent-STRIP-004] left unset, the figures keep Ant’s colour', async () => {
    const v = await mountPack('antd', 'SummaryStrip', {});

    figureColors(v).forEach((c) => expect(c).toBe(''));
  });
});

// PKB-76: in a box too short for the strip (narrow items wrap their text), the items below the box's edge were cut off
// and could not be reached. The strip now fills its box and scrolls what does not fit.
describe('Ant Design Summary Strip taller than its box', () => {
  test('[PackComponent-STRIP-005] the strip fills the box and scrolls', async () => {
    const v = await mountPack('antd', 'SummaryStrip', { items: twelve });
    const root = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(root).height).toBe('100%');
    expect(getComputedStyle(root).overflow).toBe('auto');
  });
});
