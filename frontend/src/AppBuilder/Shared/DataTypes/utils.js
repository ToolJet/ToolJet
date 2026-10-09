/**
 * isCellContentOverflowing - Detects whether a table cell's content overflows its visible box.
 *
 * Checks scroll overflow on the element itself AND on each direct child, because the
 * overflow can live in either place depending on layout:
 * - `align-items: center`  → the content child grows taller than the container (child box overflows container)
 * - `align-items: stretch` → the child box equals the container, but its text overflows the child
 * - ellipsized spans       → the child clips internally; only its own scrollWidth reveals the overflow
 * Comparing scroll size to client size covers all three, and works for bare text nodes
 * (e.g. contentEditable cells) where there is no child element to measure.
 *
 * @param {HTMLElement|null} element - The cell container (or content element) to check
 * @returns {boolean} true when any measured box has content larger than its visible area
 */
export const isCellContentOverflowing = (element) => {
  if (!element) return false;
  const boxes = [element, ...element.children];
  return boxes.some((el) => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
};

/**
 * placeCaretAtEnd - Collapses the selection to the end of a contentEditable element's content.
 *
 * Entering edit mode replaces the cell's content (React writes it via innerHTML in the same commit),
 * which detaches whatever nodes the selection was anchored to.
 * Engines then disagree: Chrome and Safari drop the selection entirely, Firefox collapses it to offset 0.
 * Placing the caret at the end unconditionally is deterministic everywhere, and is the right position both
 * for Tab (no click point existed) and for click (the click point was already destroyed).
 *
 * @param {HTMLElement|null} element - The contentEditable element to place the caret in
 */
export const placeCaretAtEnd = (element) => {
  const selection = window.getSelection?.();
  if (!element || !selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};
