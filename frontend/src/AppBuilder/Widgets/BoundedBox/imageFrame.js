/**
 * Size of the image wrapper: always the widget's full width, height capped so
 * the photo cannot overflow. Short widgets stretch rather than letterbox.
 *
 * @param {{width: number, height: number}} natural intrinsic image size
 * @param {{width: number, height: number}} box available space in the widget
 * @returns {{width: number, height: number}|null} null until both are known
 */
export function fitImageWithin(natural, box) {
  const usable = (value) => Number.isFinite(value) && value > 0;

  if (!usable(natural?.width) || !usable(natural?.height)) return null;
  if (!usable(box?.width) || !usable(box?.height)) return null;

  const heightAtFullWidth = box.width * (natural.height / natural.width);

  return { width: box.width, height: Math.min(box.height, heightAtFullWidth) };
}
