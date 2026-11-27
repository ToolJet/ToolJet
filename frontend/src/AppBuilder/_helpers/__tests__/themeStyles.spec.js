/** @jest-environment node */
import { themedRadius, themedShadow, CUSTOM_STYLE } from '../themeStyles';

// A widget's border radius and box shadow follow a theme item (borderRadiusStyle / boxShadowStyle hold its id) or are
// custom (the saved number / shadow). Widgets saved before themes had these keys have none: they render as before.
describe('themedRadius', () => {
  it('renders the saved number when custom, or when the widget predates theme radii', () => {
    expect(themedRadius(CUSTOM_STYLE, 10)).toBe('10px');
    expect(themedRadius(undefined, 10)).toBe('10px');
    expect(themedRadius('', 10)).toBe('10px');
  });

  it('points at the theme item, falling back to the saved number when the theme lacks it', () => {
    expect(themedRadius('large', 6)).toBe('var(--cc-border-radius-large, 6px)');
    expect(themedRadius('custom-a1', 8)).toBe('var(--cc-border-radius-custom-a1, 8px)');
  });

  it('uses a radius that carries its own unit as is (FileInput accepts "1rem")', () => {
    expect(themedRadius(CUSTOM_STYLE, '1rem')).toBe('1rem');
    expect(themedRadius('large', '50%')).toBe('var(--cc-border-radius-large, 50%)');
    expect(themedRadius(CUSTOM_STYLE, '12')).toBe('12px');
  });
});

describe('themedShadow', () => {
  const saved = '0px 0px 0px 0px #00000040';
  it('renders the saved shadow when custom, or when the widget predates theme shadows', () => {
    expect(themedShadow(CUSTOM_STYLE, saved)).toBe(saved);
    expect(themedShadow(undefined, saved)).toBe(saved);
  });

  it('points at the theme item, falling back to the saved shadow', () => {
    expect(themedShadow('300', saved)).toBe(`var(--cc-box-shadow-300, ${saved})`);
    expect(themedShadow('none', undefined)).toBe('var(--cc-box-shadow-none, none)');
  });
});
