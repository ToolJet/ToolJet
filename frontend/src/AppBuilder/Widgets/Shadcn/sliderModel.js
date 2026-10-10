// shadcn/ui pack (experiment): pure logic of the Slider. Takes junk (NaN, strings, objects, 10k-item arrays, min above
// max, a zero or negative step) without throwing, and never asks Radix for more thumbs than a slider can show.

// A range slider draws one thumb per value; past this, the rest of a bound list is ignored.
export const MAX_THUMBS = 10;

const finite = (v, fallback) => {
  if (v === null || v === undefined || v === '' || typeof v === 'object' || typeof v === 'boolean') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** min, max and step as Radix needs them: finite, min below max, a positive step no wider than the track. */
export const sliderBounds = ({ min, max, step } = {}) => {
  let lo = finite(min, 0);
  let hi = finite(max, 100);
  if (hi < lo) [lo, hi] = [hi, lo];
  if (hi === lo) hi = lo + 1;
  let s = finite(step, 1);
  if (s <= 0 || s > hi - lo) s = Math.min(1, hi - lo);
  return { min: lo, max: hi, step: s };
};

/** The thumbs' values: a list is a range (at most MAX_THUMBS, in order), anything else one thumb; each value is a
 *  number within the bounds (junk reads as the minimum). */
export const sliderValues = (raw, bounds) => {
  const clamp = (v) => Math.min(bounds.max, Math.max(bounds.min, finite(v, bounds.min)));
  if (!Array.isArray(raw)) return [clamp(raw)];
  const values = raw.slice(0, MAX_THUMBS).map(clamp);
  return values.length ? values.sort((a, b) => a - b) : [bounds.min];
};
