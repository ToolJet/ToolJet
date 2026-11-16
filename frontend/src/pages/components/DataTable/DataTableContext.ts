import { createContext, useContext } from 'react';

interface DataTableContextValue {
  /** Number of columns; nested rows use it for `aria-colspan`. */
  columnCount: number;
  /** CSS grid template shared by the header, rows, and anything rendered under the table (skeletons, nested tables). */
  gridTemplateColumns: string;
}

export const DataTableContext = createContext<DataTableContextValue>({ columnCount: 0, gridTemplateColumns: '' });

export const useDataTableContext = () => useContext(DataTableContext);
