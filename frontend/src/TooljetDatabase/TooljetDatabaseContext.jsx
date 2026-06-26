import React, { createContext, useContext } from 'react';

const TooljetDatabaseContext = createContext({
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
  queryFilters: {},
  setQueryFilters: () => {},
  sortFilters: {},
  setSortFilters: () => {},
  selectRows: [],
  setSelectRows: () => {},
  pageCount: 1,
  setPageCount: () => {},
  pageSize: 50,
  setPageSize: () => {},
  handleRefetchQuery: () => {},
  foreignKeys: [],
  configurations: {},
  setForeignKeys: () => [],
  setConfigurations: () => {},
});

export const TooljetDatabaseProvider = ({ value, children }) => (
  <TooljetDatabaseContext.Provider value={value}>{children}</TooljetDatabaseContext.Provider>
);

export const useTooljetDatabaseContext = () => useContext(TooljetDatabaseContext);
