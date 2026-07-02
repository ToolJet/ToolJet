import React, { useState, useMemo, useEffect } from 'react';
import TooljetDatabasePage from './TooljetDatabasePage';
import { usePostgrestQueryBuilder } from './usePostgrestQueryBuilder';
import { authenticationService } from '../_services/authentication.service';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';
import { hasBuilderRole } from '@/_helpers/utils';
import { TooljetDatabaseProvider } from './TooljetDatabaseContext';
import './styles/styles.scss';

const TooljetDatabase = () => {
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
  const [configurations, setConfigurations] = useState({});
  const [foreignKeys, setForeignKeys] = useState([]);

  const { collapseSidebar, setCollapseSidebar, setEnableCollapsibleSidebar } = useOutletContext();
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

  useEffect(() => {
    setEnableCollapsibleSidebar(true);

    return () => {
      setCollapseSidebar(false);
      setEnableCollapsibleSidebar(false);
    };
  }, []);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: `${selectedTable?.table_name || pageTitles.DATABASE}` });
  }, [selectedTable]);

  return (
    <div className="page-wrapper tooljet-database">
      <TooljetDatabaseProvider value={value}>
        <TooljetDatabasePage totalTables={tables.length || 0} collapseSidebar={collapseSidebar} />
      </TooljetDatabaseProvider>
    </div>
  );
};

export default TooljetDatabase;
