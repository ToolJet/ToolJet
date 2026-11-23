/** @jest-environment node */
import { camelCase } from 'lodash';
import { withLegacyColors } from '@tooljet/widget-definitions';
import { baseTheme } from '@/AppBuilder/_stores/utils';
import { onBrandText, setOnBrandColors } from '../onBrandText';
import { themeVariables } from '../themeVariables';

// The CSS variables an app's theme writes on <html> (useAppData). Theme definition v2 moved colours to `colors`; saved
// widgets point at the variable names (`var(--cc-primary-brand)`), so an old theme must write exactly what it did.

// Today's useAppData effect, verbatim, on a root that records what it sets (null = removed).
const writtenToday = (themeObj, mode) => {
  const vars = {};
  const root = { style: { setProperty: (n, v) => (vars[n] = v), removeProperty: (n) => (vars[n] = null) } };
  Object.keys(themeObj).forEach((category) => {
    const categoryObj = themeObj[category];
    Object.keys(categoryObj).forEach((property) => {
      const propertyObj = categoryObj[property];
      Object.keys(propertyObj).forEach((type) => {
        const color = propertyObj[type][mode];
        root.style.setProperty(`--cc-${camelCase(type)}-${camelCase(category)}`, `${color}`);
        if (type === 'placeholder' && category === 'text') {
          root.style.setProperty(`--cc-default-icon`, `${color}`);
        }
        if (category === 'text' && type === 'placeholder') {
          root.style.setProperty(`--cc-default-icon-light`, `${propertyObj[type]['light']}`);
          root.style.setProperty(`--cc-default-icon-dark`, `${propertyObj[type]['dark']}`);
          root.style.setProperty(`--cc-placeholder-text-light`, `${propertyObj[type]['light']}`);
          root.style.setProperty(`--cc-placeholder-text-dark`, `${propertyObj[type]['dark']}`);
        }
      });
    });
  });
  const radius = themeObj?.border?.radius;
  ['default', 'small', 'large'].forEach((size) => {
    const value = Number(radius?.[size]);
    if (Number.isFinite(value)) root.style.setProperty(`--cc-radius-${size}`, `${value}px`);
    else root.style.removeProperty(`--cc-radius-${size}`);
  });
  setOnBrandColors(root, themeObj?.brand?.colors?.primary?.[mode]);
  const font = typeof themeObj?.text?.font === 'string' ? themeObj.text.font.trim() : '';
  if (font)
    root.style.setProperty('--cc-font-family', `'${font.replace(/'/g, '')}', ui-sans-serif, system-ui, sans-serif`);
  else root.style.removeProperty('--cc-font-family');
  return vars;
};

// What the old loop wrote as a side effect of walking non-colour keys; nothing reads them.
const JUNK = [/-colors$/, /^--cc-\d+-text$/, /^--cc-(small|large)-border$/];
const withoutJunk = (vars) => Object.fromEntries(Object.entries(vars).filter(([n]) => !JUNK.some((j) => j.test(n))));

const rose = {
  brand: { colors: { primary: { light: '#BE123C', dark: '#E11D48' } } },
  text: {
    font: 'IBM Plex Sans',
    colors: { primary: { light: '#f8e71cff', dark: '#417505ff' }, placeholder: { light: '#776472', dark: '#998994' } },
  },
  border: {
    radius: { default: 6, small: 0, large: 0 },
    colors: { default: { light: '#CABAC3', dark: '#503E4B' }, weak: { light: '#E0D2DA', dark: '#3D2E38' } },
  },
  systemStatus: { colors: { success: { light: '#1E823B', dark: '#318344' } } },
  surface: { colors: { appBackground: { light: '#FAF6F7', dark: '#161012' } } },
};

describe('themeVariables', () => {
  describe.each(['light', 'dark'])('in %s mode', (mode) => {
    it.each([
      ['the basic theme, old shape', baseTheme.definition],
      ['a custom theme, old shape', rose],
      ['a custom theme, both shapes (a row after the v2 migration)', withLegacyColors(rose)],
    ])('writes what it wrote before for %s, plus On solid', (_label, definition) => {
      const primary = definition.brand.colors.primary[mode];
      expect(themeVariables(definition, mode)).toEqual({
        ...withoutJunk(writtenToday(definition, mode)),
        '--cc-onSolid-text': onBrandText(primary),
      });
    });
  });

  it('writes no side-effect variables for the font, the radius or the v2 keys', () => {
    const names = Object.keys(themeVariables(withLegacyColors(rose), 'light'));
    expect(names).toContain('--cc-default-border');
    names.forEach((name) => expect(JUNK.some((j) => j.test(name))).toBe(false));
  });

  it('uses a stored On solid colour over the computed one', () => {
    const definition = withLegacyColors(rose);
    definition.colors.text.onSolid = { light: '#123456', dark: '#654321' };
    expect(themeVariables(definition, 'dark')['--cc-onSolid-text']).toBe('#654321');
  });

  it('reads the colours from colors when the old groups are gone', () => {
    const vars = themeVariables(
      { version: 2, colors: { brand: { primary: { light: '#2563EB', dark: '#1D4ED8' } } } },
      'light'
    );
    expect(vars['--cc-primary-brand']).toBe('#2563EB');
    expect(vars['--cc-on-primary-brand']).toBe(onBrandText('#2563EB'));
    expect(vars['--cc-onSolid-text']).toBe(onBrandText('#2563EB'));
  });

  it('clears what the theme does not set, so a previous theme does not linger', () => {
    const vars = themeVariables({ brand: { colors: {} } }, 'light');
    ['--cc-radius-default', '--cc-font-family', '--cc-on-primary-brand', '--cc-onSolid-text'].forEach((name) =>
      expect(vars[name]).toBeNull()
    );
  });
});
