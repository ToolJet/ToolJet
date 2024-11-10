import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import Layout from '@/_ui/Layout';
import TooljetDatabasePage from './TooljetDatabasePage';
import { usePostgrestQueryBuilder } from './usePostgrestQueryBuilder';
import { authenticationService } from '../_services/authentication.service';
import { BreadCrumbContext } from '@/App/App';
import { useNavigate } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';
import { hasBuilderRole } from '@/_helpers/utils';

export const TooljetDatabaseContext = createContext({
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

export const TooljetDatabase = (props) => {
  const [organizationId, setOrganizationId] = useState(
    authenticationService?.currentSessionValue?.current_organization_id
  );
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const [searchParam, setSearchParam] = useState('');
  const [selectedTable, setSelectedTable] = useState({});
  const [selectedTableData, setSelectedTableData] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingState, setLoadingState] = useState(false);

  const [queryFilters, setQueryFilters] = useState({});
  const [sortFilters, setSortFilters] = useState({});
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [configurations, setConfigurations] = useState({});
  const [foreignKeys, setForeignKeys] = useState([]);

  const toggleCollapsibleSidebar = () => {
    setCollapseSidebar(!collapseSidebar);
  };
  const navigate = useNavigate();
  const { admin } = authenticationService.currentSessionValue;
  const isBuilder = hasBuilderRole(authenticationService?.currentSessionValue?.role ?? {});

  if (!admin && !isBuilder) {
    navigate('/');
  }

  const {
    handleBuildFilterQuery,
    handleBuildSortQuery,
    buildPaginationQuery,
    resetSortQuery,
    resetFilterQuery,
    resetAll,
    handleRefetchQuery,
  } = usePostgrestQueryBuilder({
    organizationId,
    selectedTable,
    setSelectedTableData,
    setTotalRecords,
    setLoadingState,
  });

  const getConfigurationProperty = (header, property, fallback) => {
    const columnUuid = configurations?.columns?.column_names?.[header];
    const columnConfig = configurations?.columns?.configurations?.[columnUuid] || {};
    if (!columnConfig[property]) return fallback;
    return columnConfig[property];
  };

  const value = useMemo(
    () => ({
      searchParam,
      setSearchParam,
      organizationId,
      setOrganizationId,
      tables,
      setTables,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
      selectedTableData,
      setSelectedTableData,
      totalRecords,
      setTotalRecords,
      handleBuildFilterQuery,
      handleBuildSortQuery,
      buildPaginationQuery,
      resetSortQuery,
      resetFilterQuery,
      queryFilters,
      setQueryFilters,
      sortFilters,
      setSortFilters,
      resetAll,
      pageCount,
      setPageCount,
      pageSize,
      setPageSize,
      handleRefetchQuery,
      loadingState,
      setLoadingState,
      foreignKeys,
      setForeignKeys,
      configurations,
      setConfigurations,
      getConfigurationProperty,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      searchParam,
      organizationId,
      tables,
      columns,
      selectedTable,
      selectedTableData,
      totalRecords,
      queryFilters,
      sortFilters,
      foreignKeys,
      configurations,
    ]
  );

  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    updateSidebarNAV('');
    // if (state.id && state.name) {
    //   setSelectedTable({ id: state.id, table_name: state.name });
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: `${selectedTable?.table_name || pageTitles.DATABASE}` });
  }, [selectedTable]);

  return (
    <Layout
      switchDarkMode={props.switchDarkMode}
      darkMode={props.darkMode}
      enableCollapsibleSidebar={true}
      collapseSidebar={collapseSidebar}
      toggleCollapsibleSidebar={toggleCollapsibleSidebar}
    >
      <div className="page-wrapper tooljet-database">
        <TooljetDatabaseContext.Provider value={value}>
          <TooljetDatabasePage totalTables={tables.length || 0} collapseSidebar={collapseSidebar} />
        </TooljetDatabaseContext.Provider>
      </div>
    </Layout>
  );
};
