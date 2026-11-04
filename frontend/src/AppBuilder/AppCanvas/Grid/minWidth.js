// Per-widget minimum width in px; a widget not listed keeps the default (one grid column of the main canvas).
// ListView: 140px is where its pager still fits as `‹ 1 ›` (Figma 993:21793).
export const MIN_WIDTH_PX_BY_COMPONENT = { Listview: 140 };

// Widths are stored in grid columns, so a listed minimum is rounded up to whole columns of the widget's parent canvas.
export const getMinWidthPx = (componentType, parentGridWidth, defaultMinWidth) => {
  const minWidth = MIN_WIDTH_PX_BY_COMPONENT[componentType];
  return minWidth && parentGridWidth ? Math.ceil(minWidth / parentGridWidth) * parentGridWidth : defaultMinWidth;
};
