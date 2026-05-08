import { createContext } from 'react';

// Provides the table component ID and active column key to all CodeHinter instances
// inside a column popover. Used for:
//   - rowData/cellValue autocomplete hints (via codeHinterSlice)
//   - rowData/cellValue preview resolution (via SingleLineCodeEditor customVariables)
export const TableColumnContext = createContext(null);
