import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Badge. The pack's Badge, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const countBubble = (v) => v.root().querySelector('.ant-badge-count');

// PKB-41: Container background, Border color and Border radius did nothing on a Badge with a Count. Ant draws the
// count bubble in colorError with a ring in colorBorderBg and rounds it to half its height, so none of the three
// Styles reached it. The ring now takes Border color (else Container background) and the corners take Border radius;
// left unset, the bubble keeps Ant's look.
describe('Ant Design Badge count bubble: Styles', () => {
  test('[PackComponent-BADGE-001] Container background colours the ring around the count', async () => {
    const v = await mountPack(
      'antd',
      'Badge',
      { count: 5, text: 'Inbox' },
      { styles: { colorBgContainer: '#ffeeaa' } }
    );

    expect(countBubble(v).style.boxShadow).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
  });

  test('[PackComponent-BADGE-002] Border color colours the ring, over Container background', async () => {
    const v = await mountPack(
      'antd',
      'Badge',
      { count: 5, text: 'Inbox' },
      { styles: { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff' } }
    );

    expect(countBubble(v).style.boxShadow).toMatch(/#0000ff|rgb\(0, 0, 255\)/);
  });

  test.each([
    [0, '0px'],
    [4, '4px'],
  ])('[PackComponent-BADGE-003] Border radius %s rounds the count bubble to %s', async (radius, expected) => {
    const v = await mountPack('antd', 'Badge', { count: 5, text: 'Inbox' }, { styles: { borderRadius: radius } });

    expect(countBubble(v).style.borderRadius).toBe(expected);
  });

  test('[PackComponent-BADGE-004] left unset, the count bubble keeps Ant’s own ring and round corners', async () => {
    const v = await mountPack('antd', 'Badge', { count: 5, text: 'Inbox' });

    expect(countBubble(v).style.boxShadow).toBe('');
    expect(countBubble(v).style.borderRadius).toBe('');
  });
});

// PF-056: a Status the Badge does not list (SUCCESS in capitals, a typo) reached Ant as ant-badge-status-SUCCESS, a
// class with no colour, so the dot was transparent. An unlisted Status now draws the default dot. (The same text as a
// Tag's Color is the Tag's own fix, QA PF-036.)
describe('Ant Design Badge given a status it does not know', () => {
  const dot = (v) => v.root().querySelector('.ant-badge-status-dot');

  test.each(['SUCCESS', 'foo', ''])('[PackComponent-BADGE-005] Status %j draws the default dot', async (status) => {
    const v = await mountPack('antd', 'Badge', { status, text: 'Inbox' });

    expect(dot(v).className).toContain('ant-badge-status-default');
  });

  test('[PackComponent-BADGE-006] a listed Status still draws its own dot', async () => {
    const v = await mountPack('antd', 'Badge', { status: 'success', text: 'Inbox' });

    expect(dot(v).className).toContain('ant-badge-status-success');
  });

  test('[PackComponent-BADGE-007] a Color that is not a colour leaves the Status dot', async () => {
    const v = await mountPack('antd', 'Badge', { status: 'success', color: 'SUCCESS', text: 'Inbox' });

    expect(dot(v).className).toContain('ant-badge-status-success');
    expect(dot(v).style.background).toBe('');
  });

  test('[PackComponent-BADGE-008] a CSS colour as Color still colours the dot', async () => {
    const v = await mountPack('antd', 'Badge', { status: 'success', color: '#ff0000', text: 'Inbox' });

    expect(dot(v).style.background).toMatch(/#ff0000|rgb\(255, 0, 0\)/);
  });
});

// PF-210: a long Text in a short box drew past the bottom of the box (about 120px below a 40px one), where the host
// cut it off, and nothing scrolled. The Badge now fills its box and scrolls what does not fit, as the ToolJet Text
// does; with Dynamic height the box grows with it instead. jsdom has no layout, so the oracle is what pack.css computes
// for the rendered markup.
describe('Ant Design Badge with a long Text in a short box', () => {
  afterEach(removeCopies);

  const LONG = 'Lorem ipsum dolor sit amet consectetur adipiscing elit '.repeat(6);

  test.each([
    ['a status badge', { text: LONG }],
    ['a count badge', { count: 5, text: LONG }],
  ])('[PackComponent-BADGE-009] %s fills the box and scrolls its text', async (_, props) => {
    // Break this catches: the badge drawn at its text's height past the box, which cuts it off unscrollable.
    const v = await mountPack('antd', 'Badge', props);
    const root = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(root).height).toBe('100%');
    expect(getComputedStyle(root).overflow).toBe('auto');
  });

  test('[PackComponent-BADGE-010] the count sits on the first line of a long text, not halfway down it', async () => {
    // Break this catches: the count centred on the whole text block, scrolled out of sight below a short box.
    const v = await mountPack('antd', 'Badge', { count: 5, text: LONG });
    const row = copyWithPackCss(v.root()).querySelector('.tj-ant-badge-count');

    expect(getComputedStyle(row).alignItems).toBe('baseline');
  });
});
