import { CONFIGS, NAMES, defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';
import { SKELETON_CAPABLE } from '../../../../WidgetManager/shadcnPackHelpers';

// Every pack widget has a loading look: a spinner by default; the widgets whose look is a picture of their content
// can draw a skeleton instead (the Loading look property).
installGuards();

// Nothing to show while loading (a line), the skeleton itself, and the Dialog (ModalV2's own loading, closed here).
const NO_LOOK = new Set(['ShadSeparator', 'ShadSkeleton', 'ShadDialog']);
const spinners = () => document.querySelectorAll('[role=status], .animate-spin').length;
const skeletons = () => document.querySelectorAll('.animate-pulse').length;

const loading = async (name, extra = {}) => {
  const { stats, unmount } = await mountCase({
    name,
    properties: { ...defaultsOf(name), loadingState: true, ...extra },
    styles: styleDefaultsOf(name),
  });
  const seen = { spinners: spinners(), skeletons: skeletons() };
  unmount();
  return { ...seen, problems: problemsOf(stats) };
};

describe('loading looks', () => {
  it.each(NAMES.filter((n) => !NO_LOOK.has(n)))('%s shows a spinner, and no skeleton, by default', async (name) => {
    for (const extra of [{}, { loadingIndicator: undefined }, { loadingIndicator: 'junk' }]) {
      const seen = await loading(name, extra);
      expect(seen.spinners).toBeGreaterThan(0);
      expect(seen.skeletons).toBe(0);
      expect(seen.problems).toEqual([]);
    }
  });

  it.each([...SKELETON_CAPABLE])('%s draws a skeleton when its Loading look is Skeleton', async (name) => {
    const seen = await loading(name, { loadingIndicator: 'skeleton' });
    expect(seen.skeletons).toBeGreaterThan(0);
    expect(seen.problems).toEqual([]);
  });

  it('offers the Loading look exactly on the widgets that can draw a skeleton, defaulting to Spinner', () => {
    for (const name of NAMES) {
      const offered = 'loadingIndicator' in (CONFIGS[name].properties || {});
      expect([name, offered]).toEqual([name, SKELETON_CAPABLE.has(name)]);
      if (offered) expect(CONFIGS[name].definition.properties.loadingIndicator.value).toBe('spinner');
    }
  });
});
