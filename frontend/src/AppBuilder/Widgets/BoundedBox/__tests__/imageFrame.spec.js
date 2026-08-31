/** @jest-environment node */
import { fitImageWithin } from '../imageFrame';

// The annotation overlay is positioned in PERCENTAGES of react-image-annotation's
// wrapper, so that wrapper has to be exactly the rendered photo — otherwise every
// saved annotation drifts off its subject. CSS cannot express "fit this image
// inside the box, preserve its aspect ratio, and shrink-wrap the wrapper to the
// result" all at once: driving from height distorts the image in a narrow widget,
// and driving from max-width/max-height stops the wrapper tracking it. Measured
// both against a real BoundedBox in the builder before settling on this.
describe('fitImageWithin', () => {
  const preset = { width: 746, height: 497 }; // the widget's preset photo

  it('scales a landscape photo down to the box height when height is the limit', () => {
    // 1052x406 box: height is the binding constraint (406/497 < 1052/746).
    const fitted = fitImageWithin(preset, { width: 1052, height: 406 });

    expect(fitted.height).toBeCloseTo(406, 5);
    expect(fitted.width).toBeCloseTo(609.41, 1);
    expect(fitted.width / fitted.height).toBeCloseTo(preset.width / preset.height, 5);
  });

  it('scales down to the box width when width is the limit', () => {
    // This is the case a height-driven CSS rule got wrong: it stretched the
    // photo to 200x406 instead of scaling it to 200x133.
    const fitted = fitImageWithin(preset, { width: 200, height: 406 });

    expect(fitted.width).toBeCloseTo(200, 5);
    expect(fitted.height).toBeCloseTo(133.2, 1);
    expect(fitted.width / fitted.height).toBeCloseTo(preset.width / preset.height, 5);
  });

  it('preserves aspect ratio at every box size', () => {
    const ratio = preset.width / preset.height;

    [
      { width: 1052, height: 406 },
      { width: 400, height: 406 },
      { width: 200, height: 406 },
      { width: 120, height: 406 },
      { width: 900, height: 90 },
    ].forEach((box) => {
      const fitted = fitImageWithin(preset, box);

      expect(fitted.width / fitted.height).toBeCloseTo(ratio, 5);
      expect(fitted.width).toBeLessThanOrEqual(box.width + 0.001);
      expect(fitted.height).toBeLessThanOrEqual(box.height + 0.001);
    });
  });

  it('handles a portrait photo', () => {
    const fitted = fitImageWithin({ width: 400, height: 800 }, { width: 600, height: 400 });

    expect(fitted).toEqual({ width: 200, height: 400 });
  });

  it('never enlarges beyond the box even when the photo is smaller', () => {
    const fitted = fitImageWithin({ width: 100, height: 50 }, { width: 1000, height: 1000 });

    // Upscaling a small image to fill a large box is the library's existing
    // behaviour (width: 100%), so it is preserved — but it must stay in the box.
    expect(fitted.width).toBeLessThanOrEqual(1000);
    expect(fitted.height).toBeLessThanOrEqual(1000);
    expect(fitted.width / fitted.height).toBeCloseTo(2, 5);
  });

  it('returns null when either size is not yet known', () => {
    expect(fitImageWithin({ width: 0, height: 0 }, { width: 100, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, { width: 0, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, { width: 100, height: 0 })).toBeNull();
    expect(fitImageWithin(undefined, { width: 100, height: 100 })).toBeNull();
    expect(fitImageWithin(preset, undefined)).toBeNull();
  });
});
