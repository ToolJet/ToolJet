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
