// Shared by the widget and the dynamic height calculation, so the measured height matches what renders.
export const NEW_LIST_STYLES = ['bordered', 'container', 'plain'];
export const LEGACY_PADDING = 7;
export const NEW_STYLE_PADDING = 12;
export const DIVIDER_WIDTH = 1;

// Anything but a known new style is Legacy, so a saved ListView keeps today's look.
export const getListStyle = (listStyle) => (NEW_LIST_STYLES.includes(listStyle) ? listStyle : 'legacy');

export const getRecordGap = (listStyle, gap) => (listStyle === 'legacy' ? 0 : Math.max(0, Number(gap) || 0));

// Bordered draws a line in the middle of each gap, so the line adds to the space between records.
export const getRecordSpacing = (listStyle, gap) =>
  getRecordGap(listStyle, gap) + (listStyle === 'bordered' ? DIVIDER_WIDTH : 0);

// Saved grids have no gridRecordHeight and keep their rowHeight.
export const getRecordHeight = (mode, rowHeight, gridRecordHeight) =>
  mode === 'grid' ? (gridRecordHeight ?? rowHeight) : rowHeight;
