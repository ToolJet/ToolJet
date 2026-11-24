/** Marks a side panel's header row (its title and close button), which header menus must not cover. */
export const PANEL_HEADER_ATTR = 'data-panel-header';

/**
 * How far below its trigger a right-aligned header menu has to open so it covers no panel header: a menu over the
 * Inspector's header hid its close button, and the click meant for it only closed the menu. 0 when nothing is in the
 * way. Rects are viewport rects; `menu` is the menu's own size.
 */
export const panelHeaderClearance = (triggerRect, menu, headerRects, gap = 4) => {
  if (!triggerRect || !menu) return 0;
  const left = triggerRect.right - menu.width;
  const right = triggerRect.right;
  const top = triggerRect.bottom + gap;
  return headerRects.reduce((clearance, header) => {
    const overlapsX = header.left < right && header.right > left;
    const overlapsY = header.bottom > top && header.top < top + menu.height;
    return overlapsX && overlapsY && header.width > 0 && header.height > 0
      ? Math.max(clearance, header.bottom - top + gap)
      : clearance;
  }, 0);
};

/** The headers of the panels open now. */
export const openPanelHeaderRects = (doc = document) =>
  [...doc.querySelectorAll(`[${PANEL_HEADER_ATTR}]`)].map((el) => el.getBoundingClientRect());
