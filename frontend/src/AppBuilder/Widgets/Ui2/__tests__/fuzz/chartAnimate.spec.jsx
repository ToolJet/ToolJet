import { defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';

// The charts' Animate property reaches every Recharts series as isAnimationActive: on, the series animates its
// entrance; off, it draws at once. jsdom draws both the same, so the check reads the series' props through React's
// fiber tree from the rendered shapes.
installGuards();

const CHARTS = [
  'ShadLineChart',
  'ShadComboChart',
  'ShadRadarChart',
  'ShadRadialChart',
  'ShadScatterChart',
  'ShadSparkline',
];
const animationFlags = () => {
  const flags = new Set();
  for (const el of document.querySelectorAll('svg *')) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = key ? el[key] : null; f; f = f.return) {
      if (f.memoizedProps && 'isAnimationActive' in f.memoizedProps) {
        flags.add(f.memoizedProps.isAnimationActive);
        break;
      }
    }
  }
  return [...flags];
};

describe.each(CHARTS)('%s', (name) => {
  it('turns every series animation off with Animate off, and on with it on', async () => {
    const flagsWith = async (animate) => {
      const { stats, unmount } = await mountCase({
        name,
        properties: { ...defaultsOf(name), animate },
        styles: styleDefaultsOf(name),
      });
      const flags = animationFlags();
      unmount();
      expect(problemsOf(stats)).toEqual([]);
      return flags;
    };
    expect(await flagsWith(false)).toEqual([false]);
    expect(await flagsWith(true)).toEqual([true]);
  });
});

// The funnel draws HTML bars, not Recharts: with Animate on they grow in (a CSS animation), off they are drawn at once.
it('ShadFunnelChart bars grow in with Animate on, and are drawn at once with it off', async () => {
  const animations = async (animate) => {
    const { stats, unmount } = await mountCase({
      name: 'ShadFunnelChart',
      properties: { ...defaultsOf('ShadFunnelChart'), animate },
      styles: styleDefaultsOf('ShadFunnelChart'),
    });
    const found = [...document.querySelectorAll('.rounded-\\[6px\\]')].map((el) => el.style.animation || '');
    unmount();
    expect(problemsOf(stats)).toEqual([]);
    return found;
  };
  const on = await animations(true);
  const off = await animations(false);
  expect(on.length).toBeGreaterThan(0);
  expect(on.every((a) => a.includes('tj-funnel-grow'))).toBe(true);
  expect(off.every((a) => a === '')).toBe(true);
});
