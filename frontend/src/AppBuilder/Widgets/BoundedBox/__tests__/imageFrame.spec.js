/** @jest-environment node */
import { fitImageWithin } from '../imageFrame';

describe('fitImageWithin', () => {
  const preset = { width: 746, height: 497 };

  it('uses the full widget width and caps height so the photo cannot overflow', () => {
    const fitted = fitImageWithin(preset, { width: 1052, height: 406 });

    expect(fitted.width).toBeCloseTo(1052, 5);
    expect(fitted.height).toBeCloseTo(406, 5);
  });

  it('keeps full widget width with the photo aspect when height allows', () => {
    const fitted = fitImageWithin(preset, { width: 200, height: 406 });

    expect(fitted.width).toBeCloseTo(200, 5);
    expect(fitted.height).toBeCloseTo(133.2, 1);
    expect(fitted.width / fitted.height).toBeCloseTo(preset.width / preset.height, 5);
  });

  it('is always the widget width and never taller than the widget', () => {
    [
      { width: 1052, height: 406 },
      { width: 400, height: 406 },
      { width: 200, height: 406 },
      { width: 120, height: 406 },
      { width: 900, height: 90 },
    ].forEach((box) => {
      const fitted = fitImageWithin(preset, box);

      expect(fitted.width).toBeCloseTo(box.width, 5);
      expect(fitted.height).toBeLessThanOrEqual(box.height + 0.001);
    });
  });

  it('returns null when either size is not yet known', () => {
    expect(fitImageWithin({ width: 0, height: 0 }, { width: 100, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, { width: 0, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, { width: 100, height: 0 })).toBeNull();
    expect(fitImageWithin(undefined, { width: 100, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, undefined)).toBeNull();
  });
});
