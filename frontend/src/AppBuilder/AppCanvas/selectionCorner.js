/**
 * A flex container clips its children to its rounded inner corner, which cut the corner off a flush child's
 * selection outline. The outline (selecto.scss) takes that inner radius instead, read from the container as drawn,
 * so it follows whatever card style or radius the container has.
 */
export function syncSelectionCorner(widgetEl) {
  const box = widgetEl?.closest?.('.flex-container-widget');
  if (!box) return;
  const style = getComputedStyle(box);
  const outer = parseFloat(style.borderTopLeftRadius || style.borderRadius) || 0;
  const radius = Math.max(0, outer - (parseFloat(style.borderTopWidth) || 0));
  widgetEl.style.setProperty('--tj-selection-corner', `${radius}px`);
}
