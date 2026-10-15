import useStore from '@/AppBuilder/_stores/store'; // eslint-disable-line no-unused-vars -- marks this a real-store (integration) spec
import { CONFIGS, NAMES } from './harness';

// Collapse when hidden, the native widgets' option, was missing on every pack widget: hidden in a container or on the
// page, a pack widget kept its slot as a blank band and the widgets below never moved up. RenderWidget and the reflow
// read the property generically; in a headless browser a hidden pack Alert with it on moves the Text below it up by
// its 130px, as a native Text does (benchmarks/2026-10-11-shadcn-qa/tools/collapse.mjs).
it('every pack widget has Collapse when hidden, off by default, under Additional Actions', () => {
  const missing = NAMES.filter((n) => {
    const meta = CONFIGS[n].properties?.collapseWhenHidden;
    const value = CONFIGS[n].definition?.properties?.collapseWhenHidden?.value;
    return !meta || meta.section !== 'additionalActions' || value !== '{{false}}';
  });
  expect(missing).toEqual([]);
});
