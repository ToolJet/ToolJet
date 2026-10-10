import { LOOKS, lookVars, seriesColor, whenSet } from '../shadcnLook';
import { shadcnConfigs } from '../../../WidgetManager/shadcnSource';

describe('lookVars', () => {
  it('adds nothing for unset styles, so the theme applies', () => {
    expect(lookVars('ShadTable', {})).toEqual({});
    expect(lookVars('ShadTable', { headerTextColor: '', textColor: null })).toEqual({});
    expect(lookVars('NotAPackWidget', { textColor: '#111' })).toEqual({});
  });

  it('turns set styles into the variables the widget reads, sizes in px', () => {
    expect(
      lookVars('ShadTable', { headerBackgroundColor: '#f8fafc', rowHoverColor: '#f1f5f9', borderRadius: 12 })
    ).toEqual({ '--lk-head-bg': '#f8fafc', '--lk-hover': '#f1f5f9', '--lk-radius': '12px' });
    expect(lookVars('ShadSeparator', { thickness: '2' })).toEqual({ '--lk-thick': '2px' });
    expect(lookVars('ShadButton', { borderRadius: '9999px' })).toEqual({ '--lk-radius': '9999px' });
  });

  it("overrides shadcn's own tokens for accent styles", () => {
    expect(lookVars('ShadInput', { accentColor: '#0f766e' })).toEqual({
      '--sc-primary': '#0f766e',
      '--sc-ring': '#0f766e',
    });
    expect(lookVars('ShadProgress', { barColor: '#16a34a' })).toEqual({ '--sc-primary': '#16a34a' });
    expect(lookVars('ShadBarChart', { chartColor: '#7c3aed' })).toEqual({ '--sc-chart-1': '#7c3aed' });
  });

  it('maps only styles each widget config declares, and every pack widget but Kanban has a map', () => {
    const configs = Object.fromEntries(shadcnConfigs.map((c) => [c.name, c]));
    Object.entries(LOOKS).forEach(([name, map]) => {
      map.forEach(([key]) =>
        expect([name, key, configs[name]?.styles?.[key]?.displayName]).toEqual([name, key, expect.any(String)])
      );
    });
    expect(shadcnConfigs.map((c) => c.name).filter((n) => !LOOKS[n] && n !== 'ShadKanban')).toEqual([]);
  });
});

describe('seriesColor', () => {
  it("uses the author's colour where the list names one, else the theme palette", () => {
    expect(seriesColor(['#0f766e'], 0)).toBe('#0f766e');
    expect(seriesColor(['#0f766e'], 1)).toBe('var(--sc-chart-2)');
    expect(seriesColor(undefined, 6)).toBe('var(--sc-chart-2)');
  });
});

describe('whenSet', () => {
  it('returns the classes only when the style is set', () => {
    expect(whenSet({ textColor: '#fff' }, 'textColor', 'a')).toBe('a');
    expect(whenSet({ textColor: ' ' }, 'textColor', 'a')).toBeUndefined();
    expect(whenSet(undefined, 'textColor', 'a')).toBeUndefined();
  });
});
