import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import Layout from '@/_ui/Layout';
import TooljetDatabasePage from './TooljetDatabasePage';
import { usePostgrestQueryBuilder } from './usePostgrestQueryBuilder';
import { authenticationService } from '../_services/authentication.service';
import { BreadCrumbContext } from '@/App/App';
import { useNavigate } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';

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
  setForeignKeys: () => [],
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

  const [foreignKeys, setForeignKeys] = useState([]);

  const toggleCollapsibleSidebar = () => {
    setCollapseSidebar(!collapseSidebar);
  };
  const navigate = useNavigate();
  const { admin } = authenticationService.currentSessionValue;
  // let { state } = useLocation();

  // console.log('state', selectedTable);

  if (!admin) {
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
