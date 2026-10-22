// eslint-disable-next-line import/no-unresolved
import tinycolor from 'tinycolor2';
import { getCssVarValue, getModifiedColor } from '@/AppBuilder/Widgets/utils';

const ROW_HOVER_DARKEN = 6;
const STRIPED_ROW_HOVER_DARKEN = 9;
const EDITABLE_CELL_HOVER_DARKEN = 12;
const STRIPED_EDITABLE_CELL_HOVER_DARKEN = 15;

export const getRowBackgroundStyles = (color) => {
  if (typeof color !== 'string' || !color.trim()) return {};

  const styles = { backgroundColor: color, '--cc-table-pinned-column-bg': color };
  const cssColor = color.startsWith('var(') ? getCssVarValue(document.documentElement, color) : color;
  if (!tinycolor(cssColor).isValid()) return styles;

  return {
    ...styles,
    '--cc-table-row-hover': getModifiedColor(color, ROW_HOVER_DARKEN),
    '--cc-table-striped-row-hover': getModifiedColor(color, STRIPED_ROW_HOVER_DARKEN),
    '--cc-table-editable-column-hover': getModifiedColor(color, EDITABLE_CELL_HOVER_DARKEN),
    '--cc-table-striped-editable-column-hover': getModifiedColor(color, STRIPED_EDITABLE_CELL_HOVER_DARKEN),
  };
};
