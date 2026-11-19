import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design style controls QA queue (fix/ant-design-bugs-2.0). The pack's components, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced. jsdom lays nothing out and drops var() in
// inline styles, so these read the class a style sets and the pack's rule for that class.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const PACK = path.resolve(__dirname, '../../../../../../packs/antd');
const css = fs.readFileSync(path.join(PACK, 'src/styles/pack.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// The declarations of every rule `selector` heads, alone or in a group of selectors.
const rule = (selector) =>
  css
    .split('}')
    .filter((block) =>
      block
        .split('{')[0]
        .split(',')
        .some((head) => head.trim() === selector)
    )
    .map((block) => block.split('{')[1])
    .join('');
const rootOf = (v) => v.root().querySelector('.tj-ant-root');
const missing = (el, names) => names.filter((c) => !el.classList.contains(c));
const present = (el, names) => names.filter((c) => el.classList.contains(c));

const RED = '#ff0000';
const GREEN = '#00aa00';
const BLUE = '#0000ff';
const YELLOW = '#ffeeaa';

describe('Ant Design Button: Size small with Block on', () => {
  // Break this catches: the button fills its box height, so Small only shrinks the side padding and looks like Middle.
  test('[PackComponent-ANTSTYLES-001] Small draws the small text size', async () => {
    const v = await mountPack('antd', 'Button', { size: 'small' });
    await settle();

    expect(v.root().querySelector('.ant-btn.ant-btn-sm')).not.toBeNull();
    expect(rule('.tj-ant-root.tj-ant-button .ant-btn.ant-btn-sm')).toMatch(/font-size:\s*var\(--ant-font-size-sm/);
  });
});

describe('Ant Design Slider: a Value that is not a number', () => {
  // Break this catches: Value abc draws the handle at 0 but exposes null, so a query reads a value the slider does not
  // show.
  test('[PackComponent-ANTSTYLES-002] Value abc exposes 0, where the handle is drawn', async () => {
    const v = await mountPack('antd', 'Slider', { value: 'abc' });
    await settle();

    expect(v.exposed.value).toBe(0);
    expect(v.events).toEqual([]);
  });

  // Characterization: a number given after abc is taken as it is.
  test('[PackComponent-ANTSTYLES-003] Value changed from abc to 40 exposes 40', async () => {
    const v = await mountPack('antd', 'Slider', { value: 'abc' });
    await settle();
    await v.update({ props: { value: 40 } });
    await settle();

    expect(v.exposed.value).toBe(40);
  });
});

describe('Ant Design style controls that changed nothing', () => {
  // Break this catches: Container background and Border color on a non-Custom Alert change nothing.
  test('[PackComponent-ANTSTYLES-004] Alert: Container background and Border color mark it and have a rule', async () => {
    const v = await mountPack('antd', 'Alert', {}, { styles: { colorBgContainer: RED, colorBorder: GREEN } });
    await settle();

    expect(missing(rootOf(v), ['has-bg', 'has-border'])).toEqual([]);
    expect(rule('.tj-ant-alert.has-bg:not(.tj-ant-alert--custom) .ant-alert')).toMatch(/background/);
    expect(rule('.tj-ant-alert.has-border:not(.tj-ant-alert--custom) .ant-alert')).toMatch(/border-color/);
  });

  // Break this catches: Primary color, Text color and Border color change nothing on the Carousel.
  test('[PackComponent-ANTSTYLES-005] Carousel: Primary, Text and Border color mark it and have a rule', async () => {
    const styles = { colorPrimary: RED, colorText: GREEN, colorBorder: BLUE };
    const v = await mountPack('antd', 'Carousel', {}, { styles });
    await settle();

    expect(missing(rootOf(v), ['has-primary', 'has-text', 'has-border'])).toEqual([]);
    expect(rule('.tj-ant-carousel.has-primary .slick-dots li button')).toMatch(/background/);
    // Ant draws the active dot's top layer white over its button: it stayed white.
    expect(rule('.tj-ant-carousel.has-primary .slick-dots li.slick-active::after')).toMatch(/background/);
    expect(rule('.tj-ant-carousel.has-primary .slick-arrow')).toMatch(/color/);
    expect(rule('.tj-ant-carousel.has-text .tj-ant-slide-caption')).toMatch(/color/);
    expect(rule('.tj-ant-carousel.has-border .tj-ant-slide')).toMatch(/border/);
  });

  // Break this catches: Border color changes nothing on the Slider.
  test('[PackComponent-ANTSTYLES-006] Slider: Border color marks it and colours the rail', async () => {
    const v = await mountPack('antd', 'Slider', {}, { styles: { colorBorder: BLUE } });
    await settle();

    expect(missing(rootOf(v), ['has-border'])).toEqual([]);
    expect(rule('.tj-ant-slider.has-border .ant-slider-rail')).toMatch(/background/);
  });

  // Break this catches: Text color and Container background change nothing on the Skeleton.
  test('[PackComponent-ANTSTYLES-007] Skeleton: Text color and Container background mark it and have a rule', async () => {
    const v = await mountPack('antd', 'Skeleton', {}, { styles: { colorText: GREEN, colorBgContainer: YELLOW } });
    await settle();

    expect(missing(rootOf(v), ['has-text', 'has-bg'])).toEqual([]);
    expect(rule('.tj-ant-skeleton.has-text .ant-skeleton-title')).toMatch(/background/);
    expect(rule('.tj-ant-root.tj-ant-boxed.has-bg')).toMatch(/background/);
  });

  // Break this catches: Container background changes nothing on the Empty.
  test('[PackComponent-ANTSTYLES-008] Empty: Container background marks it as a filled box', async () => {
    const v = await mountPack('antd', 'Empty', {}, { styles: { colorBgContainer: YELLOW } });
    await settle();

    expect(missing(rootOf(v), ['tj-ant-boxed', 'has-bg'])).toEqual([]);
  });

  // Break this catches: Container background and Border color change nothing on the Text and the Title.
  test.each(['Text', 'Title'])(
    '[PackComponent-ANTSTYLES-009] %s: Container background and Border color mark it; none set leaves it plain',
    async (name) => {
      const styled = await mountPack('antd', name, {}, { styles: { colorBgContainer: YELLOW, colorBorder: BLUE } });
      await settle();
      const box = styled.root().querySelector('.ant-typography');
      expect(missing(box, ['tj-ant-boxed', 'has-bg', 'has-border'])).toEqual([]);
      document.body.innerHTML = '';

      const plain = await mountPack('antd', name, {});
      await settle();
      expect(present(plain.root().querySelector('.ant-typography'), ['has-bg', 'has-border'])).toEqual([]);
      expect(rule('.tj-ant-root .tj-ant-boxed.has-border')).toMatch(/border/);
    }
  );

  // A plain component keeps the stock look: no style, no class.
  test('[PackComponent-ANTSTYLES-010] an Alert with no styles set carries no style class', async () => {
    const v = await mountPack('antd', 'Alert', {});
    await settle();

    expect(present(rootOf(v), ['has-primary', 'has-text', 'has-bg', 'has-border', 'has-radius'])).toEqual([]);
  });
});

describe('Ant Design style controls with nothing to change are not offered', () => {
  const manifest = path.join(PACK, 'dist/manifest.json');
  const styleNames = (name) =>
    (JSON.parse(fs.readFileSync(manifest, 'utf8')).components[name]?.styles ?? []).map((s) => s.name);

  // Break this catches: the Inspector offers Primary color on a Card, an Empty and a Skeleton, and Border color and
  // Border radius on an Empty, Border color on a Skeleton: none of them has a part they change.
  (fs.existsSync(manifest) ? test : test.skip)(
    '[PackComponent-ANTSTYLES-011] Card, Empty and Skeleton list only the styles they draw',
    () => {
      expect(styleNames('Card')).not.toContain('colorPrimary');
      expect(styleNames('Empty').filter((s) => ['colorPrimary', 'colorBorder', 'borderRadius'].includes(s))).toEqual(
        []
      );
      expect(styleNames('Skeleton').filter((s) => ['colorPrimary', 'colorBorder'].includes(s))).toEqual([]);
      expect(styleNames('Card')).toContain('colorBgContainer');
      expect(styleNames('Empty')).toEqual(expect.arrayContaining(['colorText', 'colorBgContainer']));
    }
  );

  // Break this catches: a dropped Slider is 4 rows high, so the track and the handle under the label are cut off.
  (fs.existsSync(manifest) ? test : test.skip)(
    '[PackComponent-ANTSTYLES-012] a dropped Slider is tall enough for its label and track',
    () => {
      expect(JSON.parse(fs.readFileSync(manifest, 'utf8')).components.Slider.defaultHeight).toBeGreaterThanOrEqual(6);
    }
  );
});
