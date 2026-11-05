import type React from 'react';

// Popups portal into the shared popup layer (usePortalContainer), so a picker in a Dialog's body is the dialog's
// sibling there, not its child: at the popups' own z-index (50) its calendar opened under the dialog's backdrop (1000)
// and a press on it landed on the backdrop. A dialog declares the level above itself as --ui-popup-layer on its
// content; custom properties inherit through the body's <slot> into the components drawn there, so a popup reads it
// off its owner when it opens and stacks above the dialog that holds it. Elsewhere it is unset and the stylesheet's
// level stands.
export const POPUP_LAYER = '--ui-popup-layer';

/** The z-index declared for popups opened from `owner` (its inherited --ui-popup-layer), if any. */
export const popupLayerOf = (owner: Element | null): number | undefined => {
  if (!owner?.isConnected) return undefined;
  const z = Number.parseInt(getComputedStyle(owner).getPropertyValue(POPUP_LAYER), 10);
  return Number.isFinite(z) ? z : undefined;
};

/** The style that stacks a popup opened from `owner` above the dialog it sits in; empty outside one. */
export const popupLayerStyle = (owner: Element | null): React.CSSProperties => {
  const z = popupLayerOf(owner);
  return z === undefined ? {} : { zIndex: z };
};
