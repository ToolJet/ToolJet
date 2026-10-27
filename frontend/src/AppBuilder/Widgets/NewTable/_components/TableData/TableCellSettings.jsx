import React, { createContext, useContext } from 'react';
import { shallow } from 'zustand/shallow';
import useTableStore from '../../_stores/tableStore';

/**
 * The table's settings its rows and cells read, read once for the table and handed down: a store subscription per cell
 * (set up as a row scrolls in, torn down as it leaves, and run on every table store write) cost more than the cell.
 * Each value changes when it did as its own subscription, so the cells re-render exactly as before.
 */
const TableCellSettings = createContext(null);

const settingsOf = (state, id) => {
  const styles = state.getTableStyles(id);
  return {
    cellHeight: styles?.cellHeight,
    isMaxRowHeightAuto: styles?.isMaxRowHeightAuto,
    maxRowHeightValue: styles?.maxRowHeightValue,
    textColor: styles?.textColor,
    contentWrap: styles?.contentWrap,
    selectRowOnCellEdit: state.getTableProperties(id)?.selectRowOnCellEdit,
    hasHoveredEvent: state.getHasHoveredEvent(id),
  };
};

/** Around everything that renders the table's cells (its rows, the add-new-row form). */
export const TableCellSettingsProvider = ({ id, children }) => {
  const settings = useTableStore((state) => settingsOf(state, id), shallow);
  return <TableCellSettings.Provider value={settings}>{children}</TableCellSettings.Provider>;
};

/** The settings of table `id`, from the provider above, or subscribed to on its own without one. */
export const useTableCellSettings = (id) => {
  const provided = useContext(TableCellSettings);
  // A component is inside the provider or not for its whole life, so this branch never changes between renders.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return provided ?? useTableStore((state) => settingsOf(state, id), shallow);
};
