// The Kanban's column and card styles as CSS variables, set on each column and card (the drag overlay and detail
// modal render outside the board, so a variable on the board would not reach them). kanban.scss reads each with the
// board style's own value as the fallback, so an unset style changes nothing.

const isSet = (value) =>
  value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'default';
const length = (value) =>
  typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value);

const pick = (styles, entries) =>
  Object.fromEntries(
    entries.filter(([key]) => isSet(styles?.[key])).map(([key, variable, toCss]) => [variable, toCss(styles[key])])
  );

const asIs = (value) => String(value);

// The card shadow is picked from presets in the inspector; any other value is used as a CSS box-shadow.
const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};
const shadow = (value) => SHADOWS[String(value).trim()] ?? String(value);

export const columnStyleVars = (styles) =>
  pick(styles, [
    ['columnBackgroundColor', '--kb-col-bg', asIs],
    ['columnBorderColor', '--kb-col-border', asIs],
    ['columnBorderRadius', '--kb-col-radius', length],
    ['columnTitleColor', '--kb-col-title', asIs],
  ]);

export const cardStyleVars = (styles) =>
  pick(styles, [
    ['cardBackgroundColor', '--kb-card-bg', asIs],
    ['cardBorderColor', '--kb-card-border', asIs],
    ['cardBorderRadius', '--kb-card-radius', length],
    ['cardBoxShadow', '--kb-card-shadow', shadow],
  ]);
