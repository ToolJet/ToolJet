import React, { useState, useMemo, useEffect } from 'react';
import TooljetDatabasePage from './TooljetDatabasePage';
import { usePostgrestQueryBuilder } from './usePostgrestQueryBuilder';
import { authenticationService } from '../_services/authentication.service';
import { useNavigate } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';
import { canAccessTooljetDbDashboard } from '@/_helpers/utils';
import { TooljetDatabaseContext } from './context';
import { TooljetDatabaseProvider } from './TooljetDatabaseContext';
import TjdbHeaderEnvironment from './HeaderEnvironment';
import { useHeaderSearchConfig } from '@/_hooks/useHeaderSearchConfig';
import { useTjdbActions, useIsDevelopmentEnvironment } from './_stores/tjdbStore';
import './styles/styles.scss';

export { TooljetDatabaseContext };

const TooljetDatabase = () => {
  const [organizationId, setOrganizationId] = useState(
    authenticationService?.currentSessionValue?.current_organization_id
  );
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  // `tables` starts empty, so "no tables yet" and "workspace has none" look the same until the first list fetch succeeds.
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const [selectedTable, setSelectedTable] = useState({});
  const [selectedTableData, setSelectedTableData] = useState([]);

  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingState, setLoadingState] = useState(false);

  const [configurations, setConfigurations] = useState({});
  const [foreignKeys, setForeignKeys] = useState([]);
  const { loadEnvironments, resetStore } = useTjdbActions();

  const navigate = useNavigate();
  // The design has no global search in the header: tables are searched in the tables panel.
  useHeaderSearchConfig({ hidden: true });

  const { admin, user_permissions } = authenticationService.currentSessionValue;
  const canEditTjdb = admin || !!user_permissions?.tjdb_c_r_u_d;
  const isDevelopmentEnvironment = useIsDevelopmentEnvironment();
  const canEditSchema = canEditTjdb && isDevelopmentEnvironment;

  if (!canAccessTooljetDbDashboard()) {
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
      canEditSchema,
      organizationId,
      setOrganizationId,
      tables,
      setTables,
      tablesLoaded,
      setTablesLoaded,
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
      resetAll,
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
      organizationId,
      tables,
      tablesLoaded,
      columns,
      selectedTable,
      selectedTableData,
      totalRecords,
      foreignKeys,
      configurations,
      canEditSchema,
    ]
  );

  useEffect(() => {
    loadEnvironments();
    // Store is a module-level singleton, not scoped to this route - reset it on unmount so the
    // selected environment doesn't leak into App Builder's TJDB query editor after navigating away.
    return () => resetStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: `${selectedTable?.table_name || pageTitles.DATABASE}` });
  }, [selectedTable]);

  return (
    <div className="page-wrapper tooljet-database">
      <TooljetDatabaseProvider value={value}>
        <TjdbHeaderEnvironment />
        <TooljetDatabasePage totalTables={tables.length || 0} />
      </TooljetDatabaseProvider>
    </div>
  );
};

export default TooljetDatabase;
