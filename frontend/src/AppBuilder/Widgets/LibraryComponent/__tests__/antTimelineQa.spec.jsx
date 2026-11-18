import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Timeline. The pack's Timeline, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
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

// What pack.css declares for a selector (one of a rule's selector list), as written: jsdom keeps calc() and var().
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

// PF-039: with a time label, Ant puts an entry's text in the right half, from the middle, at half the width less 12px;
// it keeps its 26px start margin too, so a long entry ran about 10px past the box's right edge. The width now leaves
// that margin out.
describe('Ant Design Timeline: a long entry beside a label', () => {
  test.each(['label', 'alternate', 'right'])(
    '[PackComponent-TIMELINE-001] in %s mode the entry’s width leaves room for its start margin',
    (mode) => {
      const width = declared(
        `.tj-ant-timeline .ant-timeline.ant-timeline-${mode} .ant-timeline-item-left .ant-timeline-item-content`,
        'width'
      );

      expect(width).toBe('calc(50% - var(--ant-margin-sm) - var(--ant-margin) - 10px)');
    }
  );
});

// PKB-41: Border color and Border radius did nothing on the Timeline. Border color now draws the line between the
// entries (Ant's tail, colorSplit) and Border radius rounds the dots (Ant's are round); unset, both keep Ant's look.
describe('Ant Design Timeline Border color and Border radius', () => {
  test('[PackComponent-TIMELINE-002] Border color is the line between entries, Ant’s split colour when unset', () => {
    expect(declared('.tj-ant-timeline .ant-timeline', '--ant-timeline-tail-color')).toBe(
      'var(--tj-ant-color-border, var(--ant-color-split))'
    );
  });

  test('[PackComponent-TIMELINE-003] Border radius rounds the dots, round when unset', () => {
    expect(declared('.tj-ant-timeline .ant-timeline .ant-timeline-item-head', 'border-radius')).toBe(
      'var(--tj-ant-border-radius, 50%)'
    );
  });

  test('[PackComponent-TIMELINE-004] the rules reach the rendered Timeline', async () => {
    const v = await mountPack('antd', 'Timeline', {});

    expect(v.root().querySelector('.tj-ant-timeline .ant-timeline .ant-timeline-item-head')).toBeTruthy();
  });
});

// PKB-66: an item Color that is no colour (notacolor) drew a dot with a transparent border, so the entry had no dot.
// Ant's own dot colours (blue, red, green, gray) and any colour the browser reads still apply; anything else draws the
// default blue dot. The browser is the judge (CSS.supports), stood in for by jsdom's colour parser.
describe('Ant Design Timeline item colours', () => {
  const realCss = global.CSS;
  beforeAll(() => {
    global.CSS = {
      supports: (property, value) => {
        const probe = document.createElement('i').style;
        probe.setProperty(property, value);
        return probe.getPropertyValue(property) !== '';
      },
    };
  });
  afterAll(() => {
    global.CSS = realCss;
  });

  const heads = (v) => [...v.root().querySelectorAll('.ant-timeline-item-head')];

  test('[PackComponent-TIMELINE-005] notacolor draws the default blue dot', async () => {
    const v = await mountPack('antd', 'Timeline', {
      items: [
        { children: 'Bad', color: 'notacolor' },
        { children: 'Red', color: 'red' },
        { children: 'Hex', color: '#00aa00' },
      ],
    });
    const [bad, red, hex] = heads(v);

    expect(bad.className).toContain('ant-timeline-item-head-blue');
    expect(bad.style.borderColor).toBe('');
    expect(red.className).toContain('ant-timeline-item-head-red');
    expect(hex.style.borderColor).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });
});

// PKB-76: 12 entries in a 200px box (Dynamic height off) ran far below it, and nothing scrolled to the last one. The
// Timeline now fills its box and scrolls; with Dynamic height the box grows instead.
describe('Ant Design Timeline taller than its box', () => {
  test('[PackComponent-TIMELINE-006] the Timeline fills the box and scrolls', async () => {
    const v = await mountPack('antd', 'Timeline', {
      items: Array.from({ length: 12 }, (_, i) => ({ children: `Entry ${i + 1}` })),
    });
    const root = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(root).height).toBe('100%');
    expect(getComputedStyle(root).overflow).toBe('auto');
  });
});

// The style Ant calls Container background fills the dots' centres, the only thing it colours on a Timeline, so it is
// labelled Handle color. The saved style is still colorBgContainer: apps that set it keep their colour.
describe('Ant Design Timeline Handle color', () => {
  test('[PackComponent-TIMELINE-007] the colorBgContainer style is labelled Handle color', async () => {
    const real = toolJetSdk.useStyleString;
    const declaredStyles = {};
    jest.spyOn(toolJetSdk, 'useStyleString').mockImplementation((options) => {
      declaredStyles[options.name] = options;
      return real(options);
    });
    await mountPack('antd', 'Timeline', {});

    expect(declaredStyles.colorBgContainer.label).toBe('Handle color');
  });
});

// The first entry's text sat half above the box: Ant lifts every entry's text (and time label) by the gap between its
// line height and font size, to line it up with its dot. The Timeline leaves that much room at its top.
describe('Ant Design Timeline first entry', () => {
  test('[PackComponent-TIMELINE-008] the Timeline leaves room at its top for the lifted first entry', () => {
    expect(declared('.tj-ant-timeline .ant-timeline', 'padding-top')).toBe(
      'calc(var(--ant-font-size) * var(--ant-line-height) - var(--ant-font-size))'
    );
  });
});
