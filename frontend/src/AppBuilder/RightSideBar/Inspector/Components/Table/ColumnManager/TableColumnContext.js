import { createContext } from 'react';

// Provides the table component ID to all CodeHinter instances inside a column popover,
// so they can show rowData/cellValue context hints without manual prop threading.
export const TableColumnContext = createContext(null);
