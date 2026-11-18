import React, { useState, useMemo, useEffect } from 'react';
import TooljetDatabasePage from './TooljetDatabasePage';
import { useTableRows, useInvalidateTableRows } from './rows/useTableRows';
import { isTableMissingFromEnvironment } from './constants';
import { authenticationService } from '../_services/authentication.service';
import { useNavigate } from 'react-router-dom';
import { pageTitles, fetchAndSetWindowTitle } from '@white-label/whiteLabelling';
import { canAccessTooljetDbDashboard } from '@/_helpers/utils';
import { TooljetDatabaseContext } from './context';
import { TooljetDatabaseProvider } from './TooljetDatabaseContext';
import TjdbHeaderEnvironment from './HeaderEnvironment';
import { useOpenTabs } from './TablesPanel/useOpenTabs';
import { useTablesLimit } from './TablesPanel/useTablesLimit';
import { useHeaderSearchConfig } from '@/_hooks/useHeaderSearchConfig';
import { useTjdbStore, useTjdbActions, useIsDevelopmentEnvironment } from './_stores/tjdbStore';
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
  const { reached: tablesLimitReached } = useTablesLimit(tables.length, tablesLoaded);
  const { openTabIds, openTable, closeTab, closeOtherTabs, closeAllTabs, applyTables } = useOpenTabs({
    organizationId,
    tables,
    selectedTable,
    setSelectedTable,
  });
  // The tables panel's list fetch. Rows have their own loading state (rowsLoading).
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

  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  // A table this environment lacks is moved to development by Table/index.jsx; reading it here first would be a 4xx.
  const {
    rows: selectedTableData,
    total: totalRecords,
    isLoading: rowsLoading,
    isFetching: rowsFetching,
  } = useTableRows(selectedTable.id, {
    enabled: !isTableMissingFromEnvironment(tables, selectedTable.id, selectedEnvironment),
  });
  const rowsRefetching = rowsFetching && !rowsLoading;
  // Kept under its old name for the drawers and forms that refetch after a write; any arguments are ignored,
  // since the view to refetch is whatever the store holds.
  const handleRefetchQuery = useInvalidateTableRows();

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
      tablesLimitReached,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
      openTabIds,
      openTable,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      applyTables,
      selectedTableData,
      totalRecords,
      rowsLoading,
      rowsRefetching,
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
      tablesLimitReached,
      columns,
      selectedTable,
      openTabIds,
      selectedTableData,
      totalRecords,
      rowsLoading,
      rowsRefetching,
      loadingState,
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
