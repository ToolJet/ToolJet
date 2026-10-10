// Which widgets size to their content in the viewer. One rule, read by the canvas wrapper (which slot height to use),
// the FlexContainer (whether it grows) and the component packs (whether they measure themselves), so the three agree.

const CARD_SURFACES = ['antCard', 'shadcnCard'];
const isPackWidget = (componentType) => /^(Shad|Ant)[A-Z]/.test(componentType ?? '');

/**
 * - A native widget follows its Dynamic height property.
 * - A FlexContainer drawn as a card, or laid out as a row, always fits its content: a card never scrolls inside or
 *   leaves an empty band, and a row is never a scroll area. A plain column follows the property (it may scroll).
 * - A component-pack widget fits its content unless Dynamic height is turned off: one given a guessed height (an
 *   agent's, or a default) neither clips its content nor leaves a gap under it.
 */
export const fitsContentInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer') {
    return !!properties.dynamicHeight || CARD_SURFACES.includes(properties.cardStyle) || properties.direction === 'row';
  }
  if (isPackWidget(componentType)) return properties.dynamicHeight !== false;
  return !!properties.dynamicHeight;
};

/** The reflow's gate: a height the author turned off dynamic height for stays as drawn. A FlexContainer card or row
 *  is never held (it always fits its content); every other widget keeps ToolJet's rule, dynamicHeight === false. */
export const heightHeldInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer' && fitsContentInView(componentType, { ...properties, dynamicHeight: false })) {
    return false;
  }
  return properties.dynamicHeight === false;
};
