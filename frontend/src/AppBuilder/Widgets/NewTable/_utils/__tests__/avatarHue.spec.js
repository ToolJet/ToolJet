import { avatarHue, isNobody } from '../avatarHue';

describe('avatarHue', () => {
  it('gives one name the same hue every time, and names different hues', () => {
    expect(avatarHue('Maya Chen')).toBe(avatarHue('Maya Chen'));
    const hues = new Set(['Maya Chen', 'Owen Brooks', 'Nora Williams', 'Leah Rivera', 'Noah Davis'].map(avatarHue));
    expect(hues.size).toBeGreaterThan(2);
  });
  it('is a whole degree within the circle, for anything', () => {
    for (const v of ['', null, undefined, 42, 'Ω']) {
      const h = avatarHue(v);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });
});

describe('isNobody', () => {
  it('knows placeholders for no person', () => {
    ['Unassigned', 'none', 'N/A', 'TBD', '—', '-', 'Not assigned', 'nobody'].forEach((v) =>
      expect(isNobody(v)).toBe(true)
    );
    ['Maya Chen', 'Dr. Noah Kim', 'Nina'].forEach((v) => expect(isNobody(v)).toBe(false));
  });
});
