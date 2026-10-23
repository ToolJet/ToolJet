import { PAGES_SIDEBAR_WIDTH_COLLAPSED, PAGES_SIDEBAR_WIDTH_EXPANDED } from './appCanvasConstants';

/*
 * Canvas measuring: how wide each canvas's content box is, which its NO_OF_GRIDS columns span (Container).
 * Gesture geometry (moving, resizing, snapping) lives in interaction/geometry.js.
 */

/**
 * Width changes smaller than this are float noise and keep the previous width. Kept far below a pixel: at 0.5px a
 * whole-pixel first reading (478) could block the exact one (477.53), leaving the grid wider than its canvas.
 */
const WIDTH_TOLERANCE_PX = 0.01;

/** A width state updater that keeps the previous width when `width` is within WIDTH_TOLERANCE_PX of it. */
export const keepWidthIfUnchanged = (width) => (previous) =>
  typeof previous === 'number' && Math.abs(previous - width) < WIDTH_TOLERANCE_PX ? previous : width;

/** Horizontal padding plus border of an element, in px. */
export const getHorizontalInsets = (element) => {
  if (!element) return 0;
  const style = window.getComputedStyle(element);
  return (
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0) +
    (parseFloat(style.borderLeftWidth) || 0) +
    (parseFloat(style.borderRightWidth) || 0)
  );
};

/**
 * Width a canvas offers to widgets: its border box minus padding and border. Reads the border box
 * rather than clientWidth so a scrollbar that only shows on hover does not reflow the grid.
 */
export const measureCanvasContentWidth = (element) => {
  if (!element) return 0;
  return Math.max(0, element.getBoundingClientRect().width - getHorizontalInsets(element));
};

/**
 * Content width of a canvas from layout: the used `width`, which is fractional and, unlike getBoundingClientRect,
 * unaffected by CSS transforms such as a drag preview's scale. (offsetWidth is rounded to whole pixels.)
 */
export const getLayoutContentWidth = (element) => {
  if (!element) return 0;
  const style = window.getComputedStyle(element);
  const width = parseFloat(style.width) || 0;
  return Math.max(0, style.boxSizing === 'border-box' ? width - getHorizontalInsets(element) : width);
};

/** Content width from a ResizeObserver entry: the transform-independent border box minus padding and border. */
export const contentWidthFromResizeEntry = (entry) => {
  const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
  const borderBoxWidth = borderBox?.inlineSize ?? entry.target.offsetWidth;
  return Math.max(0, borderBoxWidth - getHorizontalInsets(entry.target));
};

/**
 * Width of the page-navigation sidebar slot beside the main canvas on desktop. The pin state is
 * kept in sync with the menu style by PagesSidebarNavigation (text-only and non-collapsible menus
 * are always pinned, icon-only menus never are), so the pin state alone decides the width.
 */
export const getPagesSidebarSlotWidth = ({ position, isHidden, isPinned }) => {
  if (position !== 'side' || isHidden) return 0;
  return isPinned ? PAGES_SIDEBAR_WIDTH_EXPANDED : PAGES_SIDEBAR_WIDTH_COLLAPSED;
};
