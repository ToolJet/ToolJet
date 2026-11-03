import { canUseTheme, appliedThemeDefinition } from '../themeAccess';
import { baseTheme } from '@/AppBuilder/_stores/utils';

// The themes ToolJet ships work on every plan, like the basic theme; custom themes need the custom themes license.
describe('theme access', () => {
  const navy = {
    id: 'n',
    name: 'ToolJet Navy',
    isShipped: true,
    definition: { brand: { colors: { primary: 'navy' } } },
  };
  const custom = {
    id: 'c',
    name: 'Acme brand',
    definition: { brand: { colors: { primary: 'acme' } } },
  };
  const basic = {
    id: 'b',
    name: 'ToolJet',
    isBasic: true,
    definition: { brand: { colors: { primary: 'basic' } } },
  };

  it('lets every plan use the basic and shipped themes, and only licensed plans use custom ones', () => {
    expect(canUseTheme(basic, false)).toBe(true);
    expect(canUseTheme(navy, false)).toBe(true);
    expect(canUseTheme(custom, false)).toBe(false);
    expect(canUseTheme(custom, true)).toBe(true);
    expect(canUseTheme(undefined, false)).toBe(false);
  });

  // A version preview converts the app response to snake_case (useAppData), so the theme arrives as is_shipped.
  it('reads a shipped or basic theme in snake_case too, as a version preview stores it', () => {
    const previewNavy = { ...navy, isShipped: undefined, is_shipped: true };
    const previewBasic = { ...basic, isBasic: undefined, is_basic: true };
    expect(canUseTheme(previewNavy, false)).toBe(true);
    expect(canUseTheme(previewBasic, false)).toBe(true);
    expect(appliedThemeDefinition(previewNavy, false)).toBe(navy.definition);
  });

  it("applies a shipped theme's colours without the license", () => {
    expect(appliedThemeDefinition(navy, false)).toBe(navy.definition);
  });

  it('applies the basic colours in place of a custom theme without the license', () => {
    expect(appliedThemeDefinition(custom, false)).toBe(baseTheme.definition);
    expect(appliedThemeDefinition(basic, false)).toBe(baseTheme.definition);
    expect(appliedThemeDefinition(undefined, false)).toBe(baseTheme.definition);
  });

  it("applies any theme's colours with the license", () => {
    expect(appliedThemeDefinition(custom, true)).toBe(custom.definition);
    expect(appliedThemeDefinition(navy, true)).toBe(navy.definition);
    expect(appliedThemeDefinition(undefined, true)).toEqual({});
  });
});
