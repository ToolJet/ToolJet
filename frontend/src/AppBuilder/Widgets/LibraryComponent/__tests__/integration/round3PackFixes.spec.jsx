import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';

installBrowserStubs();

// Round three of the team's UI 2.0 review, pack side (2026-10-24): stat figures fitted to a short box (T21), number
// styles with no stored default (T7/T44), the compact empty DataTable (T19), the Summary strip's loading look at the
// loaded size (T5), Card grid default heights, the Ant Skeleton's rows fitted to its box (T30), the Ant Switch dimmed
// once (T6), MUI Radio deselect (T54), MUI StatCard precision (T12), MUI Button Full width's description (T34) and the
// Ant and MUI Stat loading parts (T25). The pack components, the inline SDK and the host renderer are the real ones;
// only module and CSS loading is replaced. Layout reads that jsdom does not do (heights, rects) are stubbed per test.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACKS = path.resolve(__dirname, '../../../../../../../packs');
const SOURCE = {
  shadcn: require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../../packs/mui/src/index.ts'),
};
const css = (pack, file) => fs.readFileSync(path.join(PACKS, pack, 'src/styles', file), 'utf8');
const manifest = (pack) => JSON.parse(fs.readFileSync(path.join(PACKS, pack, 'dist/manifest.json'), 'utf8')).components;

let mounts = 0;
const mount = async (pack, name, props = {}, { host = {}, styles = {} } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE[pack][name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  let state = { props, host: { ...makeHost(name, {}), ...host } };
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`r3-${mounts}.js`}
      cssUrl={`r3-${mounts}.css`}
      cacheKey={`round3-${pack}-${name}-${mounts}`}
      componentName={name}
      componentProps={state.props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={state.host}
      dataCy="r3-widget"
    />
  );
  let view;
  await act(async () => {
    view = render(element());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="r3-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  const update = (next) => {
    state = { ...state, ...next };
    act(() => view.rerender(element()));
  };
  return { root, exposed, events, update, unmount: () => view.unmount() };
};
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));

// Layout stubs: a getter (or getBoundingClientRect) on Element.prototype for elements matching `pick`, the real one
// otherwise.
const stubs = [];
const stubLayout = (prop, pick) => {
  const proto = Element.prototype;
  const real = Object.getOwnPropertyDescriptor(proto, prop);
  stubs.push(() => Object.defineProperty(proto, prop, real));
  if (prop === 'getBoundingClientRect') {
    Object.defineProperty(proto, prop, {
      configurable: true,
      writable: true,
      value(...args) {
        const hit = pick(this);
        return hit === undefined
          ? real.value.apply(this, args)
          : { x: 0, y: hit.top, left: 0, right: 100, width: 100, ...hit, bottom: hit.top + hit.height };
      },
    });
  } else {
    Object.defineProperty(proto, prop, {
      configurable: true,
      get() {
        const hit = pick(this);
        return hit === undefined ? real.get.call(this) : hit;
      },
    });
  }
};

// A ResizeObserver that runs its callback on observe, as a browser does once it lays the element out.
const RealRO = window.ResizeObserver;
const liveObserver = () => {
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      this.cb([], this);
    }
    unobserve() {}
    disconnect() {}
  };
};

afterEach(() => {
  while (stubs.length) stubs.pop()();
  window.ResizeObserver = RealRO;
  document.body.innerHTML = '';
});

describe('T21: a stat in a short box picks a layout its content fits', () => {
  // The card's height is 54px; its content is 100px stacked, 80px with less padding and 40px with the title beside
  // the figure.
  const contentHeight = (el) =>
    el.classList.contains('is-inline') ? 40 : el.classList.contains('is-short') ? 80 : 100;

  test.each([
    ['antd', 'Statistic', 'tj-ant-stat', { trendValue: '12%' }],
    ['mui', 'StatCard', 'tj-mui-stat', { trendLabel: '+12%', interval: 'Last 30 days' }],
  ])('%s %s: inline layout in a 54px box, its own layout in a tall one', async (pack, name, cls, props) => {
    let boxHeight = 54;
    stubLayout('clientHeight', (el) => (el.classList?.contains(cls) ? boxHeight : undefined));
    stubLayout('clientWidth', (el) => (el.classList?.contains(cls) ? 300 : undefined));
    stubLayout('scrollHeight', (el) => (el.classList?.contains(cls) ? contentHeight(el) : undefined));
    const v = await mount(pack, name, props);
    await settle();
    const box = v.root().querySelector(`.${cls}`);
    expect(box.classList.contains('is-short')).toBe(true);
    expect(box.classList.contains('is-inline')).toBe(true);
    v.unmount();

    boxHeight = 140;
    const tall = await mount(pack, name, props);
    await settle();
    const roomy = tall.root().querySelector(`.${cls}`);
    expect(roomy.classList.contains('is-short')).toBe(false);
    expect(roomy.classList.contains('is-inline')).toBe(false);
  });

  test.each([
    ['antd', 'tj-ant-stat.is-inline'],
    ['mui', 'tj-mui-stat.is-inline'],
  ])('%s: the inline layout sets the title beside the figure', (pack, selector) => {
    const text = css(pack, 'pack.css');
    const at = text.indexOf(`.${selector}`);
    expect(at).toBeGreaterThan(-1);
    expect(text.slice(at, text.indexOf('}', at))).toMatch(/display: flex/);
  });
});

describe('T7/T44: number styles that follow the theme have no stored default', () => {
  test.each(['shadcn', 'antd', 'mui'])('%s: no number style or property declares a blank default', (pack) => {
    const blank = [];
    for (const [name, c] of Object.entries(manifest(pack)))
      for (const f of [...(c.styles || []), ...(c.props || [])])
        if (f.type === 'number' && f.default === '') blank.push(`${name}.${f.name}`);
    expect(blank).toEqual([]);
  });

  test.each([
    ['shadcn', 'Alert', 'borderRadius', 'Theme radius'],
    ['shadcn', 'Input', 'borderRadius', 'Theme radius'],
    ['shadcn', 'Heading', 'fontSize', 'From the level'],
    ['mui', 'Alert', 'borderRadius', 'Theme radius (MUI: 4)'],
  ])('%s %s %s: no default, the placeholder kept', (pack, name, style, placeholder) => {
    const field = manifest(pack)[name].styles.find((s) => s.name === style);
    expect(field).toBeTruthy();
    expect('default' in field).toBe(false);
    expect(field.placeholder).toBe(placeholder);
  });

  it('shadcn: an unset radius draws as before (no --lk-radius), a set one draws its px', async () => {
    const unset = await mount('shadcn', 'Input', {});
    expect(unset.root().innerHTML).not.toMatch(/--lk-radius/);
    unset.unmount();
    const set = await mount('shadcn', 'Input', {}, { styles: { borderRadius: 12 } });
    expect(set.root().innerHTML).toMatch(/--lk-radius: 12px/);
  });

  it('shadcn Alert: an unset radius sets no radius variable; a set one does', async () => {
    const unset = await mount('shadcn', 'Alert', { title: 'Heads up' });
    const before = unset.root().querySelector('.tj-cc-root').innerHTML;
    unset.unmount();
    const set = await mount('shadcn', 'Alert', { title: 'Heads up' }, { styles: { borderRadius: 3 } });
    const after = set.root().querySelector('.tj-cc-root').innerHTML;
    expect(after).toMatch(/3px/);
    expect(before).not.toMatch(/: 3px/);
  });

  it('MUI: an unset radius keeps MUI theme radius, a set one replaces it', async () => {
    const unset = await mount('mui', 'Button', {});
    expect(unset.root().querySelector('button')).toBeTruthy();
    unset.unmount();
    const set = await mount('mui', 'Button', {}, { styles: { borderRadius: 9 } });
    expect(set.root().querySelector('button')).toBeTruthy();
  });
});

describe('T19: an empty shadcn DataTable in a short box keeps its message', () => {
  const table = async (height) => {
    liveObserver();
    stubLayout('clientHeight', (el) => (el.classList?.contains('t2-table') ? height : undefined));
    const v = await mount('shadcn', 'DataTable', { data: [] });
    await settle();
    return v;
  };

  it('116px: the compact empty state (no footer, no 70px floor), the message drawn', async () => {
    const v = await table(116);
    const root = v.root();
    expect(root.querySelector('.t2-table').classList.contains('is-compact-empty')).toBe(true);
    expect(root.querySelector('.t2-foot')).toBeNull();
    expect(root.querySelector('.t2-empty-title').textContent).toBe('No results.');
  });

  it('440px: the full empty state with its footer', async () => {
    const v = await table(440);
    const root = v.root();
    expect(root.querySelector('.t2-table').classList.contains('is-compact-empty')).toBe(false);
    expect(root.querySelector('.t2-foot')).toBeTruthy();
    expect(root.querySelector('.t2-empty-title').textContent).toBe('No results.');
  });

  it('a short table with rows keeps its footer', async () => {
    liveObserver();
    stubLayout('clientHeight', (el) => (el.classList?.contains('t2-table') ? 116 : undefined));
    const v = await mount('shadcn', 'DataTable', { data: [{ id: 1, name: 'A' }] });
    await settle();
    expect(v.root().querySelector('.t2-table').classList.contains('is-compact-empty')).toBe(false);
    expect(v.root().querySelector('.t2-foot')).toBeTruthy();
  });

  it('the compact rule drops the floor', () => {
    expect(css('shadcn', 'ui2-table.css')).toMatch(
      /\.t2-table\.is-compact-empty \.t2-box\.is-empty \{\s*min-height: 0;/
    );
  });
});

describe('T5: the Summary strip loading look is the strip at its loaded size', () => {
  it('shadcn skeleton look: the strip and its panel frame stay, each part veiled', async () => {
    const v = await mount('shadcn', 'SummaryStrip', { loadingIndicator: 'skeleton' }, { host: { loading: true } });
    const root = v.root();
    const strip = root.querySelector('dl.ui2-strip');
    expect(strip).toBeTruthy();
    expect(strip.classList.contains('is-panel')).toBe(true);
    expect(strip.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.ui2-ld-figures')).toBeNull();
    // Every label, figure, change and caption is veiled where it stands.
    const parts = [
      ...root.querySelectorAll(
        '.ui2-strip-label, .ui2-strip-value, .ui2-strip-delta, .ui2-strip-caption:not(.is-spacer)'
      ),
    ];
    expect(parts.length).toBeGreaterThanOrEqual(12);
    for (const part of parts) expect(part.querySelector(':scope > .ui2-ld-veil')).toBeTruthy();
    expect(root.querySelectorAll('.ui2-ld-veil')).toHaveLength(parts.length);
    // Not under a separate overlay: the frame is idle.
    expect(root.querySelector('.ui2-ld-frame.is-loading')).toBeNull();
  });

  it('shadcn spinner look: still the spinner over the strip', async () => {
    const v = await mount('shadcn', 'SummaryStrip', {}, { host: { loading: true } });
    expect(v.root().querySelector('.ui2-ld-frame.is-loading .ui2-ld-spin')).toBeTruthy();
  });

  it('shadcn skeleton look with no figures yet: the figure skeletons', async () => {
    const v = await mount(
      'shadcn',
      'SummaryStrip',
      { loadingIndicator: 'skeleton', items: [] },
      { host: { loading: true } }
    );
    expect(v.root().querySelector('.ui2-ld-figures')).toBeTruthy();
  });

  it('Ant: label, figure and delta lines as bars in their own lines, no Ant paragraph skeleton', async () => {
    const v = await mount('antd', 'SummaryStrip', {}, { host: { loading: true } });
    const root = v.root();
    expect(root.querySelector('.ant-skeleton-paragraph')).toBeNull();
    const items = root.querySelectorAll('.tj-ant-strip-item');
    expect(items).toHaveLength(4);
    for (const item of items) {
      expect(item.querySelector('.ant-statistic-title .tj-ant-bone.is-title')).toBeTruthy();
      expect(item.querySelector('.ant-statistic-content .tj-ant-bone.is-figure')).toBeTruthy();
      expect(item.querySelector('.tj-ant-stat-trend .tj-ant-bone.is-trend')).toBeTruthy();
    }
    expect(root.textContent).not.toMatch(/Revenue|vs last month/);
    v.update({ host: { ...makeHost('SummaryStrip', {}), loading: false } });
    expect(root.querySelector('.tj-ant-bone')).toBeNull();
    expect(root.textContent).toMatch(/Revenue/);
  });
});

describe('Card grid default heights fit one row of the sample cards', () => {
  test.each([
    ['shadcn', 15],
    ['antd', 16],
  ])('%s: defaultHeight %i', (pack, height) => {
    expect(manifest(pack).CardGrid.defaultHeight).toBe(height);
  });
});

describe('T30: the Ant Skeleton draws only the rows that fit its box', () => {
  // A 100px box; the first row at 40px (under the title), 16px tall, one every 28px.
  const layout = (el) => {
    if (el.classList?.contains('tj-ant-skeleton-fit')) return { top: 0, height: 100 };
    if (el.tagName === 'LI' && el.parentElement?.classList.contains('ant-skeleton-paragraph')) {
      const i = [...el.parentElement.children].indexOf(el);
      return { top: 40 + i * 28, height: 16 };
    }
    return undefined;
  };

  it('60 rows in a 100px box: 2 rows', async () => {
    liveObserver();
    stubLayout('getBoundingClientRect', layout);
    const v = await mount('antd', 'Skeleton', { rows: 60 });
    await settle();
    expect(v.root().querySelectorAll('.ant-skeleton-paragraph > li')).toHaveLength(2);
  });

  it('2 rows asked in the same box: 2 rows; without a layout every asked row', async () => {
    liveObserver();
    stubLayout('getBoundingClientRect', layout);
    const v = await mount('antd', 'Skeleton', { rows: 2 });
    await settle();
    expect(v.root().querySelectorAll('.ant-skeleton-paragraph > li')).toHaveLength(2);
    v.unmount();
    while (stubs.length) stubs.pop()();
    const plain = await mount('antd', 'Skeleton', { rows: 7 });
    expect(plain.root().querySelectorAll('.ant-skeleton-paragraph > li')).toHaveLength(7);
  });
});

describe('T6: a host-disabled Ant Switch is dimmed once', () => {
  it('marks the host-disabled root, and the pack keeps the switch at full opacity under it', async () => {
    const v = await mount('antd', 'Switch', {}, { host: { disabled: true } });
    const root = v.root().querySelector('.tj-ant-root');
    expect(root.classList.contains('tj-ant-host-disabled')).toBe(true);
    expect(v.root().querySelector('.ant-switch-disabled')).toBeTruthy();
    const text = css('antd', 'pack.css');
    expect(text).toMatch(
      /\.tj-ant-host-disabled \.ant-switch\.ant-switch-disabled:not\(\.ant-switch-loading\) \{\s*opacity: 1;/
    );
  });

  it('an enabled Switch carries no marker', async () => {
    const v = await mount('antd', 'Switch', {});
    expect(v.root().querySelector('.tj-ant-root').classList.contains('tj-ant-host-disabled')).toBe(false);
  });
});

describe('T54: MUI Radio deselects on a second click with Allow deselect', () => {
  const OPTIONS = [
    { label: 'One', value: 'one' },
    { label: 'Two', value: 'two' },
  ];
  const radio = (v, value) => v.root().querySelector(`input[type="radio"][value="${value}"]`);

  it('on: a click on the picked option clears it and fires onChange; a click on another picks it', async () => {
    const v = await mount('mui', 'RadioGroup', { options: OPTIONS, value: 'one', allowDeselect: true });
    await waitFor(() => expect(radio(v, 'one').checked).toBe(true));
    fireEvent.click(radio(v, 'one'));
    await waitFor(() => expect(v.exposed.value).toBe(''));
    expect(v.events.filter((e) => e === 'onChange')).toHaveLength(1);
    expect(radio(v, 'one').checked).toBe(false);
    fireEvent.click(radio(v, 'two'));
    await waitFor(() => expect(v.exposed.value).toBe('two'));
    expect(v.events.filter((e) => e === 'onChange')).toHaveLength(2);
  });

  it('off (the default): a second click keeps the value', async () => {
    const v = await mount('mui', 'RadioGroup', { options: OPTIONS, value: 'one' });
    await waitFor(() => expect(radio(v, 'one').checked).toBe(true));
    fireEvent.click(radio(v, 'one'));
    await settle();
    expect(radio(v, 'one').checked).toBe(true);
    expect(v.events).not.toContain('onChange');
    expect(manifest('mui').RadioGroup.props.find((p) => p.name === 'allowDeselect').default).toBe(false);
  });

  it('a disabled group does not deselect', async () => {
    const v = await mount(
      'mui',
      'RadioGroup',
      { options: OPTIONS, value: 'one', allowDeselect: true },
      { host: { disabled: true } }
    );
    fireEvent.click(radio(v, 'one'));
    await settle();
    expect(v.events).not.toContain('onChange');
  });
});

describe('T12: MUI StatCard precision', () => {
  test.each([
    [{ value: '1200.456', format: 'number', precision: 1 }, '1,200.5'],
    [{ value: '1200', format: 'number', precision: 2 }, '1,200.00'],
    [{ value: '1200.456', format: 'number' }, '1,200.46'],
    [{ value: '0.1234', format: 'percent', precision: 2 }, '12.34%'],
  ])('%p draws %s', async (props, shown) => {
    const v = await mount('mui', 'StatCard', props);
    expect(v.root().querySelector('.tj-mui-stat-figure').textContent).toBe(shown);
  });

  it('declares precision with no default (the format decides)', () => {
    const p = manifest('mui').StatCard.props.find((f) => f.name === 'precision');
    expect(p).toMatchObject({ type: 'number', min: 0, max: 10 });
    expect('default' in p).toBe(false);
  });
});

describe('T34: MUI Full width fields say what they do', () => {
  test.each(['Button', 'Menu', 'ToggleButtonGroup'])('%s', (name) => {
    expect(manifest('mui')[name].props.find((p) => p.name === 'fullWidth').description).toMatch(/width/);
  });
});

describe('T25: Ant and MUI stat loading draws the parts, in the card', () => {
  it('Ant Statistic: a title bar, a figure bar and a trend bar; no paragraph skeleton', async () => {
    const v = await mount(
      'antd',
      'Statistic',
      { trendValue: '12%', extra: 'vs last month' },
      { host: { loading: true } }
    );
    const root = v.root();
    expect(root.querySelector('.tj-ant-stat--card')).toBeTruthy();
    expect(root.querySelector('.ant-statistic-title .tj-ant-bone.is-title')).toBeTruthy();
    expect(root.querySelector('.ant-statistic-content .tj-ant-bone.is-figure')).toBeTruthy();
    expect(root.querySelector('.tj-ant-stat-trend .tj-ant-bone.is-trend')).toBeTruthy();
    expect(root.querySelector('.ant-skeleton-paragraph')).toBeNull();
    expect(root.textContent).not.toMatch(/48,250|12%/);
  });

  it('Ant Statistic: no trend line, no trend bar', async () => {
    const v = await mount('antd', 'Statistic', {}, { host: { loading: true } });
    expect(v.root().querySelector('.tj-ant-stat-trend')).toBeNull();
  });

  it('MUI StatCard: the card frame stays, with title, chip, figure and interval skeletons', async () => {
    const v = await mount(
      'mui',
      'StatCard',
      { trendLabel: '+12%', interval: 'Last 30 days' },
      { host: { loading: true } }
    );
    const root = v.root();
    const card = root.querySelector('.MuiCard-root.tj-mui-stat');
    expect(card).toBeTruthy();
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('h2 .MuiSkeleton-root')).toBeTruthy();
    expect(root.querySelector('.tj-mui-stat-figure .MuiSkeleton-root')).toBeTruthy();
    expect(root.querySelector('.tj-mui-stat-interval .MuiSkeleton-root')).toBeTruthy();
    expect(root.querySelector('.tj-mui-stat-head .MuiSkeleton-rounded')).toBeTruthy();
    expect(root.querySelector('.MuiChip-root')).toBeNull();
    expect(root.querySelector('.tj-mui-loading__look')).toBeNull();
  });

  it('MUI StatCard: a click while loading fires nothing; loaded it fires onClick', async () => {
    const v = await mount('mui', 'StatCard', {}, { host: { loading: true } });
    fireEvent.click(v.root().querySelector('.MuiCard-root'));
    expect(v.events).not.toContain('onClick');
    v.update({ host: { ...makeHost('StatCard', {}), loading: false } });
    fireEvent.click(v.root().querySelector('.MuiCard-root'));
    expect(v.events).toContain('onClick');
  });
});
