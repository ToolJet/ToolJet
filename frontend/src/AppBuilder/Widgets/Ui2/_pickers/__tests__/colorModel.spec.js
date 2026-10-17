import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';

describe('pickers model: colour', () => {
  it('normalises hex and rgb text, with alpha only when allowed', () => {
    expect(M.normalizeHex('#ABC')).toBe('#aabbcc');
    expect(M.normalizeHex('6366F1')).toBe('#6366f1');
    expect(M.normalizeHex('#6366f180')).toBe('#6366f1');
    expect(M.normalizeHex('#6366f180', true)).toBe('#6366f180');
    expect(M.normalizeHex('#6366f1ff', true)).toBe('#6366f1');
    expect(M.normalizeHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(M.normalizeHex('rgba(0,0,0,0.5)', true)).toBe('#00000080');
    expect(M.normalizeHex('rgb(300,0,0)')).toBeNull();
    expect(M.normalizeHex('red')).toBeNull();
    expect(M.normalizeHex(null)).toBeNull();
  });

  it('gives the rgb forms and round-trips through HSV', () => {
    expect(M.colorForms('#6366f1')).toEqual({ rgb: 'rgb(99, 102, 241)', rgba: 'rgba(99, 102, 241, 1)' });
    expect(M.colorForms('')).toEqual({ rgb: '', rgba: '' });
    for (const hex of ['#6366f1', '#000000', '#ffffff', '#22c55e', '#ef4444']) {
      const rgb = M.hexToRgba(hex);
      expect(M.rgbaToHex(M.hsvToRgb(M.rgbToHsv(rgb)))).toBe(hex);
    }
    expect(M.rgbaToHex({ r: 999, g: -4, b: NaN })).toBe('#ff0000');
  });

  it('keeps valid, distinct swatches and picks a readable check colour', () => {
    expect(M.toSwatches(['#fff', '#FFFFFF', 'nope', null, '#000'])).toEqual(['#ffffff', '#000000']);
    expect(M.toSwatches('junk')).toEqual([]);
    expect(M.contrastOn('#ffffff')).toBe('#000000');
    expect(M.contrastOn('#0f172a')).toBe('#ffffff');
  });
});
