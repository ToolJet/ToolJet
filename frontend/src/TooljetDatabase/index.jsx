import React, { useState, useMemo, useEffect, useContext } from 'react';
import Layout from '@/_ui/Layout';
import TooljetDatabasePage from './TooljetDatabasePage';
import { usePostgrestQueryBuilder } from './usePostgrestQueryBuilder';
import { authenticationService } from '../_services/authentication.service';
import { appEnvironmentService } from '@/_services';
import { BreadCrumbContext } from '@/App/App';
import { useNavigate } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';
import { hasBuilderRole } from '@/_helpers/utils';
import { TooljetDatabaseContext } from './context';
import './styles/styles.scss';

export { TooljetDatabaseContext };

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
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);

  const toggleCollapsibleSidebar = () => {
    setCollapseSidebar(!collapseSidebar);
  };
  const navigate = useNavigate();
  const { admin, user_permissions } = authenticationService.currentSessionValue;
  const isBuilder = hasBuilderRole(authenticationService?.currentSessionValue?.role ?? {});
  const canEditTjdb = admin || !!user_permissions?.tjdb_c_r_u_d;

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
      canEditTjdb,
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
      environments,
      selectedEnvironment,
      setSelectedEnvironment,
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
      environments,
      selectedEnvironment,
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

  // Org-scoped (no app_id) - CE gets back a single-entry list (its one licensed environment),
  // EE/licensed orgs get dev/staging/production ordered by priority. Default selection is always
  // the lowest-priority entry (development).
  useEffect(() => {
    appEnvironmentService.getAllEnvironments().then(({ environments: fetchedEnvironments = [] }) => {
      const sorted = [...fetchedEnvironments].sort((a, b) => a.priority - b.priority);
      setEnvironments(sorted);
      setSelectedEnvironment(sorted[0] ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: `${selectedTable?.table_name || pageTitles.DATABASE}` });
  }, [selectedTable]);

  return (
    // Wraps Layout (not just the page content) so Header - rendered by Layout above
    // {children} - can also read this context: the environment switcher lives in the page header,
    // next to the breadcrumb, not inside the table view.
    <TooljetDatabaseContext.Provider value={value}>
      <Layout
        switchDarkMode={props.switchDarkMode}
        darkMode={props.darkMode}
        enableCollapsibleSidebar={true}
        collapseSidebar={collapseSidebar}
        toggleCollapsibleSidebar={toggleCollapsibleSidebar}
      >
        <div className="page-wrapper tooljet-database">
          <TooljetDatabasePage totalTables={tables.length || 0} collapseSidebar={collapseSidebar} />
        </div>
      </Layout>
    </TooljetDatabaseContext.Provider>
  );
};
