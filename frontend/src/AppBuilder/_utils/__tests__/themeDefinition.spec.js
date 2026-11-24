/** @jest-environment node */
import camelCase from 'lodash/camelCase';
import {
  toV2,
  withLegacyColors,
  themeColorTokens,
  resolveThemeWrite,
  DEFAULT_BORDER_RADII,
  DEFAULT_SHADOWS,
} from '@tooljet/widget-definitions';
import { baseTheme } from '@/AppBuilder/_stores/utils';

// Theme definition v2 (docs: custom theme v2, §10). Colours move to `colors.<group>.<token>.{light, dark}`; rows keep
// the old groups beside them until a cleanup migration, so both shapes have to agree and the CSS variable names every
// saved widget points at (`var(--cc-primary-brand)`) must not change.

const legacy = baseTheme.definition;

// A saved custom theme: an 8-digit hex the editor writes, and the `disabled` tokens the old DTO allows.
const rose = {
  brand: { colors: { primary: { light: '#BE123C', dark: '#E11D48' } } },
  text: {
    font: 'IBM Plex Sans',
    colors: {
      primary: { light: '#f8e71cff', dark: '#417505ff' },
      placeholder: { light: '#776472', dark: '#998994' },
      disabled: { light: '#aaaaaa', dark: '#555555' },
    },
  },
  border: {
    radius: { default: 6, small: 0, large: 0 },
    colors: {
      default: { light: '#CABAC3', dark: '#503E4B' },
      weak: { light: '#E0D2DA', dark: '#3D2E38' },
      disabled: { light: '#bbbbbb', dark: '#444444' },
    },
  },
  systemStatus: { colors: { success: { light: '#1E823B', dark: '#318344' } } },
  surface: { colors: { appBackground: { light: '#FAF6F7', dark: '#161012' } } },
};

// What useAppData writes for an old-shape theme today, minus the `disabled` tokens no widget reads (the oracle for
// "a saved app looks the same").
const variablesToday = (definition, mode) => {
  const out = {};
  Object.entries(definition).forEach(([group, section]) =>
    Object.entries(section.colors || {}).forEach(([token, pair]) => {
      if (token !== 'disabled') out[`--cc-${camelCase(token)}-${camelCase(group)}`] = pair[mode];
    })
  );
  return out;
};
const variablesFrom = (definition, mode) =>
  Object.fromEntries(themeColorTokens(definition).map((t) => [t.cssVar, t[mode]]));

describe('toV2', () => {
  it('moves the old colour groups under colors, keeping every value as stored', () => {
    expect(toV2(rose).colors).toEqual({
      brand: { primary: { light: '#BE123C', dark: '#E11D48' } },
      text: {
        primary: { light: '#f8e71cff', dark: '#417505ff' },
        placeholder: { light: '#776472', dark: '#998994' },
      },
      border: {
        strong: { light: '#CABAC3', dark: '#503E4B' },
        weak: { light: '#E0D2DA', dark: '#3D2E38' },
      },
      systemStatus: { success: { light: '#1E823B', dark: '#318344' } },
      surface: { appBackground: { light: '#FAF6F7', dark: '#161012' } },
    });
  });

  it('marks the shape and keeps the old groups beside it (old bundles still read them)', () => {
    const v2 = toV2(rose);
    expect(v2.version).toBe(2);
    ['brand', 'text', 'border', 'systemStatus', 'surface'].forEach((group) => expect(v2[group]).toEqual(rose[group]));
  });

  it('is idempotent and leaves its input untouched', () => {
    const input = structuredClone(rose);
    const once = toV2(input);
    expect(toV2(once)).toEqual(once);
    expect(input).not.toHaveProperty('version');
    expect(input).not.toHaveProperty('colors');
    withLegacyColors(once);
    expect(once.colors).toEqual(toV2(rose).colors);
  });

  it('takes colors as the source of truth when a definition already has them', () => {
    const edited = { ...toV2(rose), colors: { brand: { primary: { light: '#000000', dark: '#111111' } } } };
    expect(toV2(edited).colors).toEqual({ brand: { primary: { light: '#000000', dark: '#111111' } } });
  });

  it('handles a missing or empty definition', () => {
    expect(toV2(undefined)).toMatchObject({ version: 2, colors: {} });
    expect(toV2({})).toMatchObject({ version: 2, colors: {} });
  });
});

describe('withLegacyColors', () => {
  it('rewrites the old groups from colors, so both shapes agree after a save', () => {
    const edited = toV2(rose);
    edited.colors.brand.primary = { light: '#000000', dark: '#111111' };
    edited.colors.border.strong = { light: '#222222', dark: '#333333' };
    const saved = withLegacyColors(edited);
    expect(saved.brand.colors.primary).toEqual({ light: '#000000', dark: '#111111' });
    expect(saved.border.colors.default).toEqual({ light: '#222222', dark: '#333333' });
    expect(saved.colors).toEqual(edited.colors);
  });

  it('keeps the old non-colour keys the component packs read (font, radius)', () => {
    const saved = withLegacyColors(toV2(rose));
    expect(saved.text.font).toBe('IBM Plex Sans');
    expect(saved.border.radius).toEqual({ default: 6, small: 0, large: 0 });
  });

  it('leaves On solid out of the old groups (the old schema, and tooljet-mcp, reject unknown tokens)', () => {
    const v2 = toV2(rose);
    v2.colors.text.onSolid = { light: '#ffffff', dark: '#ffffff' };
    expect(withLegacyColors(v2).text.colors).not.toHaveProperty('onSolid');
  });

  it('round-trips an old definition (bar the unused disabled tokens)', () => {
    const roundTrip = withLegacyColors(toV2(legacy));
    ['brand', 'text', 'border', 'systemStatus', 'surface'].forEach((group) =>
      expect(roundTrip[group]).toEqual(legacy[group])
    );
  });
});

// What the server saves. A stored row holds both shapes, and so does whatever a client read from it: a new client
// edits `colors` (its old groups come back stale), an old bundle edits the old groups (its `colors` come back stale),
// tooljet-mcp sends the old groups alone. A colour counts as edited in `colors` only when it differs from the row.
describe('resolveThemeWrite', () => {
  const black = { light: '#000000', dark: '#111111' };
  const stored = () => withLegacyColors(rose);

  it('saves a new theme in both shapes, colors first', () => {
    const saved = resolveThemeWrite({ ...toV2(rose), colors: { ...toV2(rose).colors, brand: { primary: black } } });
    expect(saved.colors.brand.primary).toEqual(black);
    expect(saved.brand.colors.primary).toEqual(black);
  });

  it('keeps an edit made in colors by a new client', () => {
    const sent = stored();
    sent.colors = { ...sent.colors, brand: { primary: black } };
    const saved = resolveThemeWrite(sent, stored());
    expect(saved.colors.brand.primary).toEqual(black);
    expect(saved.brand.colors.primary).toEqual(black);
  });

  it('keeps an edit made in the old groups by an old bundle that sent stale colors back', () => {
    const sent = stored();
    sent.brand = { colors: { ...sent.brand.colors, primary: black } };
    const saved = resolveThemeWrite(sent, stored());
    expect(saved.colors.brand.primary).toEqual(black);
    expect(saved.brand.colors.primary).toEqual(black);
  });

  it('keeps On solid when an old bundle saves', () => {
    const row = stored();
    row.colors.text.onSolid = { light: '#ffffff', dark: '#ffffff' };
    const sent = structuredClone(row);
    sent.brand = { colors: { ...sent.brand.colors, primary: black } };
    expect(resolveThemeWrite(sent, row).colors.text.onSolid).toEqual({ light: '#ffffff', dark: '#ffffff' });
  });

  it('converts the old groups alone (tooljet-mcp) into both shapes', () => {
    const sent = structuredClone(rose);
    sent.brand.colors.primary = black;
    const saved = resolveThemeWrite(sent, stored());
    expect(saved.version).toBe(2);
    expect(saved.colors.brand.primary).toEqual(black);
    expect(saved.brand.colors.primary).toEqual(black);
  });
});

describe('themeColorTokens', () => {
  it.each(['light', 'dark'])('writes the same %s-mode variables as today for an old theme', (mode) => {
    expect(variablesFrom(legacy, mode)).toEqual(variablesToday(legacy, mode));
    expect(variablesFrom(rose, mode)).toEqual(variablesToday(rose, mode));
  });

  it('names the Strong border --cc-default-border, as saved widgets expect', () => {
    const strong = themeColorTokens(rose).find((t) => t.group === 'border' && t.token === 'strong');
    expect(strong.cssVar).toBe('--cc-default-border');
  });

  it('gives On solid its own variable', () => {
    const v2 = toV2(rose);
    v2.colors.text.onSolid = { light: '#ffffff', dark: '#0a0a0a' };
    expect(variablesFrom(v2, 'dark')['--cc-onSolid-text']).toBe('#0a0a0a');
  });

  it('lists only colours, never the font or radius (no junk variables)', () => {
    const tokens = themeColorTokens(rose);
    expect(tokens).toHaveLength(7);
    tokens.forEach((t) => {
      expect(t.light).toMatch(/^#/);
      expect(t.dark).toMatch(/^#/);
    });
  });
});

// Theme definition v2 border radii and box shadows: named lists the theme editor shows. Built-in items (from the
// design) are locked: editable, never removed, keyed by a stable id so renaming one does not break a reference.
describe('border radius and box shadow lists', () => {
  const custom8 = { id: 'c-8', name: 'Rounded', value: 8 };
  const customShadow = {
    id: 'c-s',
    name: 'Card',
    x: 0,
    y: 1,
    blur: 3,
    spread: 0,
    color: { light: '#00000040', dark: '#00000080' },
  };

  it('has the designed built-in radii and shadows, all locked', () => {
    expect(DEFAULT_BORDER_RADII.map(({ id, name, value }) => [id, name, value])).toEqual([
      ['none', 'None', 0],
      ['small', 'Small', 2],
      ['medium', 'Medium', 4],
      ['large', 'Large', 6],
    ]);
    expect(DEFAULT_SHADOWS.map(({ id, name, x, y, blur, spread }) => [id, name, x, y, blur, spread])).toEqual([
      ['none', 'None', 0, 0, 0, 0],
      ['100', '100', 0, 2, 4, 0],
      ['200', '200', 0, 2, 4, 0],
      ['300', '300', 0, 4, 8, 0],
      ['400', '400', 0, 8, 16, 0],
      ['500', '500', 0, 16, 24, 0],
    ]);
    DEFAULT_SHADOWS.forEach((s) => expect(s.color).toEqual({ light: expect.any(String), dark: expect.any(String) }));
    [...DEFAULT_BORDER_RADII, ...DEFAULT_SHADOWS].forEach((item) => expect(item.locked).toBe(true));
  });

  it("gives a theme without lists the built-in ones, and keeps a theme's own", () => {
    const v2 = toV2(rose);
    expect(v2.borderRadius).toEqual(DEFAULT_BORDER_RADII);
    expect(v2.shadows).toEqual(DEFAULT_SHADOWS);
    const own = toV2({ ...rose, borderRadius: [...DEFAULT_BORDER_RADII, custom8] });
    expect(own.borderRadius).toEqual([...DEFAULT_BORDER_RADII, custom8]);
    expect(toV2(own)).toEqual(own);
  });

  it('does not share the built-in lists between themes', () => {
    toV2(rose).borderRadius[0].value = 99;
    expect(DEFAULT_BORDER_RADII[0].value).toBe(0);
  });

  describe('saving', () => {
    const stored = () =>
      resolveThemeWrite({
        ...rose,
        borderRadius: [...DEFAULT_BORDER_RADII, custom8],
        shadows: [...DEFAULT_SHADOWS, customShadow],
      });

    it('keeps added and edited items', () => {
      const sent = stored();
      sent.borderRadius = sent.borderRadius.map((r) => (r.id === 'medium' ? { ...r, name: 'Mid', value: 5 } : r));
      const saved = resolveThemeWrite(sent, stored());
      expect(saved.borderRadius.find((r) => r.id === 'medium')).toMatchObject({ name: 'Mid', value: 5, locked: true });
      expect(saved.borderRadius).toContainEqual(custom8);
      expect(saved.shadows).toContainEqual(customShadow);
    });

    it('keeps the stored lists when a client sends none (tooljet-mcp, an old bundle)', () => {
      const saved = resolveThemeWrite(structuredClone(rose), stored());
      expect(saved.borderRadius).toEqual(stored().borderRadius);
      expect(saved.shadows).toEqual(stored().shadows);
    });

    it('puts back a built-in item a client left out, built-ins first, and keeps it locked', () => {
      const sent = stored();
      sent.borderRadius = [custom8, ...sent.borderRadius.filter((r) => r.id !== 'small' && r.id !== 'c-8')];
      sent.shadows = sent.shadows.map((s) => ({ ...s, locked: false }));
      const saved = resolveThemeWrite(sent, stored());
      expect(saved.borderRadius.map((r) => r.id)).toEqual(['none', 'small', 'medium', 'large', 'c-8']);
      saved.shadows.filter((s) => s.id !== 'c-s').forEach((s) => expect(s.locked).toBe(true));
    });
  });
});
