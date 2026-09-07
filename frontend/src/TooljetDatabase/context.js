import { createContext } from 'react';

// Split out of index.jsx so components outside the TooljetDatabase page (e.g. the shared page
// Header, which renders the environment switcher next to the breadcrumb) can read this context
// without pulling in index.jsx's import chain (Layout -> Header -> ...circular back to itself).
export const TooljetDatabaseContext = createContext({
  canEditTjdb: false,
  canEditSchema: false,
  organizationId: null,
  setOrganizationId: () => {},
  selectedTable: '',
  setSelectedTable: () => {},
  searchParam: '',
  setSearchParam: () => {},
  selectedTableData: [],
  setSelectedTableData: () => {},
  tables: [],
  setTables: () => {},
  columns: [],
  setColumns: () => {},
  totalRecords: 0,
  setTotalRecords: () => {},
  loadingState: false,
  setLoadingState: () => {},
  handleBuildFilterQuery: () => {},
  handleBuildSortQuery: () => {},
  buildPaginationQuery: () => {},
  resetSortQuery: () => {},
  resetFilterQuery: () => {},
  selectRows: [],
  setSelectRows: () => {},
  handleRefetchQuery: () => {},
  foreignKeys: [],
  configurations: {},
  setForeignKeys: () => [],
  setConfigurations: () => {},
});
