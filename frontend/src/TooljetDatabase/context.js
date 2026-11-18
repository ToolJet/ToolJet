import { createContext } from 'react';

// Split out of index.jsx so components can read this context without pulling in index.jsx's import chain.
// Only components rendered inside TooljetDatabaseProvider get real values. The shared page Header sits
// above the provider (it lives in the layout route), so it only gets these defaults - the environment
// switcher is portaled into the Header from inside the provider (see HeaderSlotPortal).
export const TooljetDatabaseContext = createContext({
  canEditTjdb: false,
  canEditSchema: false,
  organizationId: null,
  setOrganizationId: () => {},
  selectedTable: {},
  setSelectedTable: () => {},
  openTabIds: [],
  openTable: () => {},
  closeTab: () => {},
  closeOtherTabs: () => {},
  closeAllTabs: () => {},
  applyTables: () => {},
  selectedTableData: [],
  tables: [],
  setTables: () => {},
  tablesLoaded: false,
  setTablesLoaded: () => {},
  tablesLimitReached: false,
  columns: [],
  setColumns: () => {},
  totalRecords: 0,
  rowsLoading: false,
  loadingState: false,
  setLoadingState: () => {},
  selectRows: [],
  setSelectRows: () => {},
  handleRefetchQuery: () => {},
  foreignKeys: [],
  configurations: {},
  setForeignKeys: () => [],
  setConfigurations: () => {},
});
