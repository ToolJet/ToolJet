import React, { useContext, useMemo } from 'react';

import { useHeaderEnvironmentSelect } from '@/_hooks/useHeaderEnvironmentSelect';
import { useLicenseStore } from '@/_stores/licenseStore';
import { isMultiEnvLicenseInvalid, getMultiEnvLicenseLockMessage } from '@/_helpers/multiEnvLicense';
import { TooljetDatabaseContext } from '../context';
import { useTjdbStore, useTjdbActions } from '../_stores/tjdbStore';
import { runUnlessDirty } from '../_stores/unsavedChanges';
import MigrationHistoryDrawer from '../Drawers/MigrationHistoryDrawer';
import { buildHeaderEnvironments } from './buildHeaderEnvironments';
import { useTableMigrations } from './useTableMigrations';

/**
 * Puts the environment select in the page header and owns the migration history drawer that its menu opens.
 *
 * The header sits above TooljetDatabaseProvider, so it cannot read the page's tables or migrations. This renders
 * inside the provider and hands the header what it needs through `useHeaderEnvironmentSelect`.
 */
const TjdbHeaderEnvironment = () => {
  const { organizationId, tables, selectedTable, tablesLoaded } = useContext(TooljetDatabaseContext);
  const environments = useTjdbStore((state) => state.environments);
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const isHistoryOpen = useTjdbStore((state) => state.isMigrationHistoryOpen);
  const { switchEnvironment, closeMigrationHistory } = useTjdbActions();
  const featureAccess = useLicenseStore((state) => state.featureAccess);
  const { tableMigrations, refetchTableMigrations, refetchTables } = useTableMigrations();

  const tableId = selectedTable?.id;
  const relationsByEnvironment = useMemo(
    () => tables?.find((table) => table.id === tableId)?.environments ?? [],
    [tables, tableId]
  );

  // With no table open there is nothing to switch: a table that has no relation in the chosen environment errors.
  // The exception is a workspace with no tables on a non-Development environment: Create table is disabled there, so
  // the select is the way back to Development.
  const emptyWorkspaceOutsideDevelopment =
    tablesLoaded && tables.length === 0 && selectedEnvironment && selectedEnvironment.priority !== 1;
  const showSelect =
    environments.length > 1 && !!selectedEnvironment && (!!tableId || emptyWorkspaceOutsideDevelopment);

  const headerSelect = useMemo(() => {
    if (!showSelect) return null;
    const multiEnvLocked = isMultiEnvLicenseInvalid(featureAccess);
    return {
      environments: buildHeaderEnvironments({
        environments,
        selectedEnvironment,
        tableId,
        relationsByEnvironment,
        tableMigrations,
        multiEnvLocked,
        lockMessage: getMultiEnvLicenseLockMessage(featureAccess),
      }),
      environmentId: selectedEnvironment.id,
      // The switch drops the grid's add row and any open editor, so unsaved input is asked about first.
      onChange: (environmentId) =>
        runUnlessDirty(() => switchEnvironment(environments.find((environment) => environment.id === environmentId))),
    };
  }, [
    showSelect,
    environments,
    selectedEnvironment,
    tableId,
    relationsByEnvironment,
    tableMigrations,
    featureAccess,
    switchEnvironment,
  ]);

  useHeaderEnvironmentSelect(headerSelect);

  return (
    <MigrationHistoryDrawer
      isOpen={isHistoryOpen && !!tableId}
      onClose={closeMigrationHistory}
      migrations={tableMigrations?.migrations ?? []}
      environments={tableMigrations?.environments ?? []}
      allEnvironments={environments}
      relationsByEnvironment={relationsByEnvironment}
      organizationId={organizationId}
      selectedTable={selectedTable}
      refetchMigrations={refetchTableMigrations}
      refetchTables={refetchTables}
    />
  );
};

export default TjdbHeaderEnvironment;
