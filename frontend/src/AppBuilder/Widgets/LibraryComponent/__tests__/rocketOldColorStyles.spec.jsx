import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-175): a Rocket 2.0 ToggleGroup whose older Selected color style (selectedColor, from apps saved before the
// rename) held text that isn't a colour drew its selected option transparent; Selected background with the same text
// keeps the default. The Checkbox's older Label color (textColor) and the MultiSelect's older Chip background
// (chipColor) did the same. The pack components, the inline SDK and the host renderer are the real ones; only module
// and CSS loading is replaced, and CSS.supports (the browser's colour check, which jsdom lacks) answers as a browser
// does for the values used here.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const BROWSER_COLORS = new Set(['#ff0000', 'red']);
const realSupports = window.CSS?.supports;
beforeEach(() => {
  window.CSS = window.CSS ?? {};
  window.CSS.supports = (property, value) => property === 'color' && BROWSER_COLORS.has(value);
});
afterEach(() => {
  window.CSS.supports = realSupports;
  document.body.innerHTML = '';
});

// The colour a component hands its stylesheet for `cssVar` ('' when it draws the default).
const drawn = async (name, props, styles, cssVar) => {
  const v = await mountPack('shadcn', name, props, { styles });
  const el = [...v.root().querySelectorAll('[style]')].find((node) => node.style.getPropertyValue(cssVar) !== '');
  return el?.style.getPropertyValue(cssVar) ?? '';
};

describe.each([
  ['ToggleGroup', 'selectedColor', {}, '--lk-on-bg', 'TOGGLE'],
  ['Checkbox', 'textColor', {}, '--lk-label', 'CHECKBOX'],
  ['MultiSelect', 'chipColor', { defaultValues: ['apple'] }, '--lk-chip-bg', 'MULTI'],
])('Rocket %s: its older colour style %s ignores text that is not a colour', (name, style, props, cssVar, id) => {
  test(`[PackComponent-${id}-OLDCOLOR-001] "notacolor" keeps the default`, async () => {
    expect(await drawn(name, props, { [style]: 'notacolor' }, cssVar)).toBe('');
  });

  test(`[PackComponent-${id}-OLDCOLOR-002] control: a real colour is still drawn`, async () => {
    expect(await drawn(name, props, { [style]: '#ff0000' }, cssVar)).toBe('#ff0000');
  });
});
