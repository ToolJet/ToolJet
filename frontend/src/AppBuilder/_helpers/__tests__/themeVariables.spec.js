/** @jest-environment node */
import { camelCase } from 'lodash';
import { withLegacyColors, DEFAULT_BORDER_RADII, DEFAULT_SHADOWS } from '@tooljet/widget-definitions';
import { baseTheme } from '@/AppBuilder/_stores/utils';
import { onBrandText, setOnBrandColors } from '../onBrandText';
import { themeVariables, applyThemeVariables, radiusVar, shadowVar } from '../themeVariables';

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

// What the old loop wrote as a side effect of walking non-colour keys (the v2 lists included); nothing reads them.
const JUNK = [/-colors$/, /^--cc-\d+-text$/, /^--cc-(small|large)-border$/, /-shadows$/, /-borderRadius$/];
const withoutJunk = (vars) => Object.fromEntries(Object.entries(vars).filter(([n]) => !JUNK.some((j) => j.test(n))));

// The built-in border radii and shadows every theme without its own lists writes.
const builtInListVars = (mode) => ({
  ...Object.fromEntries(DEFAULT_BORDER_RADII.map((r) => [`--cc-border-radius-${r.id}`, `${r.value}px`])),
  ...Object.fromEntries(
    DEFAULT_SHADOWS.map((s) => [
      `--cc-box-shadow-${s.id}`,
      `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color[mode]}`,
    ])
  ),
});

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
        ...builtInListVars(mode),
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

// Theme definition v2 border radii and box shadows: one variable per item, which widgets set to a theme item point at
// (`var(--cc-border-radius-<id>, <saved>px)`).
describe('border radius and box shadow variables', () => {
  const definition = {
    ...withLegacyColors(rose),
    borderRadius: [...DEFAULT_BORDER_RADII, { id: 'custom-a1', name: 'Rounded', value: 8 }],
    shadows: [
      ...DEFAULT_SHADOWS,
      {
        id: 'custom-b2',
        name: 'Card',
        x: 0,
        y: 2,
        blur: 10,
        spread: 0,
        color: { light: '#00000040', dark: '#ffffff26' },
      },
    ],
  };

  it('writes one variable per radius, and per shadow in the colour of the mode', () => {
    const light = themeVariables(definition, 'light');
    const dark = themeVariables(definition, 'dark');
    expect(light[radiusVar('large')]).toBe('6px');
    expect(light[radiusVar('custom-a1')]).toBe('8px');
    expect(light[shadowVar('custom-b2')]).toBe('0px 2px 10px 0px #00000040');
    expect(dark[shadowVar('custom-b2')]).toBe('0px 2px 10px 0px #ffffff26');
    expect(radiusVar('large')).toBe('--cc-border-radius-large');
    expect(shadowVar('300')).toBe('--cc-box-shadow-300');
  });

  it('keeps an item id that is not a valid CSS name from breaking the variable', () => {
    expect(radiusVar('my radius!')).toBe('--cc-border-radius-my-radius-');
  });

  describe('applyThemeVariables', () => {
    const fakeRoot = (initial = {}) => {
      const props = { ...initial };
      return {
        props,
        style: {
          setProperty: (n, v) => (props[n] = v),
          removeProperty: (n) => delete props[n],
          get length() {
            return Object.keys(props).length;
          },
          item: (i) => Object.keys(props)[i],
        },
      };
    };

    it('sets the variables and removes the ones mapped to null', () => {
      const root = fakeRoot({ '--cc-font-family': 'x' });
      applyThemeVariables(root, { '--cc-primary-brand': '#111111', '--cc-font-family': null });
      expect(root.props).toEqual({ '--cc-primary-brand': '#111111' });
    });

    it('removes radius and shadow variables a previous theme wrote, so widgets fall back to their saved value', () => {
      const root = fakeRoot({
        [radiusVar('custom-old')]: '20px',
        [shadowVar('custom-old')]: '0 0 1px red',
        '--cc-weak-border': '#eee',
      });
      applyThemeVariables(root, themeVariables(rose, 'light'));
      expect(root.props).not.toHaveProperty(radiusVar('custom-old'));
      expect(root.props).not.toHaveProperty(shadowVar('custom-old'));
      expect(root.props[radiusVar('large')]).toBe('6px');
      expect(root.props['--cc-weak-border']).toBe('#E0D2DA');
    });
  });
});
