import { onBrandText } from '../onBrandText';

describe('onBrandText', () => {
  // Help desk build (2026-10-12): "New ticket" and the selected filter drew near-black text on a #3D85C6 blue. By
  // contrast alone black wins (5.2 against 4.0), but on a saturated mid-tone a reader expects white.
  it('puts white on saturated mid-tone accents', () => {
    ['#3D85C6', '#2563EB', '#0D9488', '#059669', '#C2410C', '#B45309', '#E11D48', '#7C3AED', '#0284C7'].forEach((c) =>
      expect([c, onBrandText(c)]).toEqual([c, '#ffffff'])
    );
  });
  it('keeps dark text on light accents where white would be unreadable', () => {
    ['#F59E0B', '#FBBF24', '#A3E635', '#FDE68A', '#2DD4BF', '#ffffff'].forEach((c) =>
      expect([c, onBrandText(c)]).toEqual([c, '#0a0a0a'])
    );
  });
  it('returns null for a missing or invalid colour', () => {
    expect(onBrandText(undefined)).toBeNull();
    expect(onBrandText('not a colour')).toBeNull();
  });
});
