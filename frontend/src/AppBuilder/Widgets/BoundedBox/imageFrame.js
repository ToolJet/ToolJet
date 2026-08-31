/**
 * Largest box with `natural`'s aspect ratio that fits inside `box`.
 *
 * react-image-annotation positions every annotation overlay as a PERCENTAGE of
 * its image wrapper, so that wrapper must be exactly the rendered photo or all
 * saved annotations drift off their subjects. Fitting the photo to the widget
 * while keeping the wrapper glued to it cannot be expressed in CSS alone:
 *
 *   - `height: 100%; width: auto` keeps the wrapper glued but stretches the
 *     photo whenever the widget is narrower than the photo's aspect ratio wants.
 *   - `max-width: 100%; max-height: 100%` scales the photo correctly but leaves
 *     the wrapper at full box height, so the two stop agreeing.
 *
 * Computing the fit here and applying it to the wrapper in px satisfies both.
 *
 * @param {{width: number, height: number}} natural intrinsic image size
 * @param {{width: number, height: number}} box available space in the widget
 * @returns {{width: number, height: number}|null} null until both are known
 */
export function fitImageWithin(natural, box) {
  const usable = (value) => Number.isFinite(value) && value > 0;

  if (!usable(natural?.width) || !usable(natural?.height)) return null;
  if (!usable(box?.width) || !usable(box?.height)) return null;

  const scale = Math.min(box.width / natural.width, box.height / natural.height);

  return { width: natural.width * scale, height: natural.height * scale };
}
