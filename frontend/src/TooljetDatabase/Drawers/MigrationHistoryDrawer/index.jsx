import React, { useEffect, useMemo, useState } from 'react';
import { capitalize } from 'lodash';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import { ToolTip } from '@/_components/ToolTip';
import { tooljetDatabaseService } from '@/_services';
import { ArrowLeft, ArrowRight, Download, Plus, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/Rocket/ToggleGroup/ToggleGroup';
import { ROCKET_SCROLLBAR } from '@/components/ui/Rocket/scrollbar';
import generateFile from '@/_lib/generate-file';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import { useTjdbStore, useTjdbActions } from '../../_stores/tjdbStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { isMultiEnvLicenseInvalid, getMultiEnvLicenseLockMessage } from '@/_helpers/multiEnvLicense';
import {
  envHasRelation,
  findHeadMigrationId,
  formatMigrationNumber,
  isEnvironmentLocked,
  TABLE_ABSENT_TOOLTIP,
} from '../../constants';
import { MigrationTimelineItem } from './MigrationTimelineItem';

const TAB_LABELS = ['Development', 'Staging', 'Production'];

function formatTimestamp(date) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
}

// Always compares the active env against its own immediate downstream neighbor (never a
// fixed chain-head or a hardcoded env name) - a previous version diffed every tab against
// chainLength (== development's own count), which read as permanently 0 on the Development
// tab and mislabeled the Staging tab's real "behind development" gap as "ahead of production".
function StatusLine({ activeEnv, nextEnv, missingInNextCount }) {
  if (!nextEnv) {
    return (
      <>
        Production is not up to date with latest changes. Apply migration from development to staging, and then to
        production to see them reflected here.
      </>
    );
  }
  return (
    <>
      {capitalize(activeEnv.name)} is{' '}
      <span className="tw-font-title-default tw-text-text-default">
        {missingInNextCount} migration{missingInNextCount === 1 ? '' : 's'} ahead
      </span>{' '}
      of {nextEnv.name}.
    </>
  );
}

const MigrationHistoryDrawer = ({
  isOpen,
  onClose,
  migrations,
  environments,
  allEnvironments,
  relationsByEnvironment = [],
  organizationId,
  selectedTable,
  refetchMigrations,
  refetchTables,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedMigrationId, setExpandedMigrationId] = useState(null);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const { switchEnvironment } = useTjdbActions();
  const { runMigration, modal: newMigrationModal } = useMigrationModal();
  const featureAccess = useLicenseStore((state) => state.featureAccess);
  // Environment actions need a fresh license verdict: a plan that expired or was downgraded
  // mid-session would otherwise leave promote enabled against a stale multiEnvironment flag.
  // Only the license is re-read here - never the environments list, whose reload would reset
  // the selection back to development (see tjdbStore.loadEnvironments).
  const multiEnvLocked = isMultiEnvLicenseInvalid(featureAccess);

  // Open on whichever environment the switcher is currently viewing, not always Development.
  useEffect(() => {
    if (!isOpen) return;
    useLicenseStore.getState().actions.fetchFeatureAccess();
    const index = allEnvironments.findIndex((env) => env.id === selectedEnvironment?.id);
    setActiveTab(index >= 0 ? index : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const chainLength = migrations.length;
  const latestMigrationId = migrations[chainLength - 1]?.id ?? null;
  const reversedMigrations = useMemo(() => [...migrations].reverse(), [migrations]);

  const envStateByPriorityIndex = allEnvironments.map((env) => environments.find((e) => e.environment_id === env.id));

  const activeEnvState = envStateByPriorityIndex[activeTab];
  const appliedIds = activeEnvState?.applied_migration_ids ?? [];
  const appliedCount = appliedIds.length;
  const headMigrationId = findHeadMigrationId(migrations, appliedIds);

  const nextEnv = allEnvironments[activeTab + 1];
  const nextEnvState = nextEnv ? envStateByPriorityIndex[activeTab + 1] : null;
  // Sets, not counts: the next environment can hold as many migrations as this one and still lack some of them.
  const nextAppliedIds = new Set(nextEnvState?.applied_migration_ids ?? []);
  const missingInNextCount = appliedIds.filter((id) => !nextAppliedIds.has(id)).length;
  const nextEnvBehind = nextEnv && missingInNextCount > 0;
  // Promote replays migrations through the sibling relation in the target environment;
  // without a multi-environment license the backend rejects it (403), so pre-gate here
  // instead of surfacing an error toast after the click.
  const canPromote = nextEnv && nextEnvBehind && !isEnvironmentLocked(nextEnv, multiEnvLocked);

  const handleClose = () => {
    setExpandedMigrationId(null);
    setPromoteTarget(null);
    onClose();
  };

  // The migration confirmation opens above this drawer; a focus trap here would keep it from taking focus.
  const drawerProps = {
    isOpen,
    onClose: handleClose,
    position: 'right',
    className: 'tj-db-drawer',
    disableFocus: true,
    drawerStyle: { width: '480px' },
  };

  if (promoteTarget) {
    return (
      <Drawer {...drawerProps}>
        <PromotePreviewView
          promoteTarget={promoteTarget}
          organizationId={organizationId}
          tableId={selectedTable?.id}
          tableName={selectedTable?.table_name}
          onBack={() => setPromoteTarget(null)}
          onClose={handleClose}
          refetchMigrations={refetchMigrations}
          refetchTables={refetchTables}
        />
      </Drawer>
    );
  }

  return (
    <Drawer {...drawerProps}>
      <div
        className="tw-flex tw-h-full tw-flex-col tw-bg-background-surface-layer-01"
        data-cy="migration-history-drawer"
      >
        <header className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-py-0 tw-pl-4 tw-pr-3">
          <h2 className="tw-m-0 tw-font-title-x-large tw-text-text-default">Migration history</h2>
          <Button variant="ghost" iconOnly size="medium" aria-label="Close" onClick={handleClose}>
            <X />
          </Button>
        </header>

        <div
          className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3 tw-overflow-y-auto tw-p-4 ${ROCKET_SCROLLBAR}`}
        >
          <ToggleGroup
            type="single"
            size="medium"
            className="tw-w-full"
            value={TAB_LABELS[activeTab]}
            // Radix reports '' when the pressed item is pressed again; the tab stays.
            onValueChange={(label) => label && setActiveTab(TAB_LABELS.indexOf(label))}
            aria-label="Environment"
          >
            {TAB_LABELS.map((label, index) => {
              // locked folds the list's `enabled` flag with the live license verdict, so a stale list
              // after expiry/downgrade still renders the plan tooltip instead of a misleading "table
              // does not exist". Development is never locked.
              const environment = allEnvironments[index];
              const locked = !environment || isEnvironmentLocked(environment, multiEnvLocked);
              const available = !locked && envHasRelation(relationsByEnvironment, environment.id);
              const tab = (
                <ToggleGroupItem
                  value={label}
                  disabled={!available}
                  className="tw-w-full"
                  data-cy={`migration-history-tab-${label.toLowerCase()}`}
                >
                  {label}
                </ToggleGroupItem>
              );
              // Every tab sits in a cell of the same width, with or without the tooltip around it.
              const cell = <div className="tw-flex tw-min-w-0 tw-flex-1">{tab}</div>;
              if (available) return <React.Fragment key={label}>{cell}</React.Fragment>;
              const tooltipMessage = locked ? getMultiEnvLicenseLockMessage(featureAccess) : TABLE_ABSENT_TOOLTIP;
              return (
                <ToolTip key={label} message={tooltipMessage} placement="top">
                  {cell}
                </ToolTip>
              );
            })}
          </ToggleGroup>

          <div className="tw-flex tw-flex-col tw-gap-2" data-cy="migration-history-status">
            <span className="tw-font-title-small tw-uppercase tw-text-text-placeholder">Status</span>
            <p className="tw-m-0 tw-font-body-default tw-text-text-medium">
              <StatusLine
                activeEnv={allEnvironments[activeTab]}
                nextEnv={nextEnv}
                missingInNextCount={missingInNextCount}
              />
            </p>
          </div>

          <div>
            {reversedMigrations.map((migration, index) => {
              const applied = appliedIds.includes(migration.id);
              const isHere = migration.id === headMigrationId && activeTab !== 0 && appliedCount < chainLength;
              return (
                <MigrationTimelineItem
                  key={migration.id}
                  number={formatMigrationNumber(migration.migration_number)}
                  title={migration.name}
                  description={migration.description}
                  date={formatTimestamp(migration.createdAt ?? migration.created_at)}
                  sql={migration.sql}
                  applied={applied}
                  latest={migration.id === latestMigrationId}
                  hereLabel={isHere ? `${TAB_LABELS[activeTab]} is here` : null}
                  expanded={expandedMigrationId === migration.id}
                  onToggleSql={() => setExpandedMigrationId(expandedMigrationId === migration.id ? null : migration.id)}
                  last={index === reversedMigrations.length - 1}
                />
              );
            })}
          </div>
        </div>

        <footer className="tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
          {/* Raw SQL authoring always targets the table's own development relation
              (recordRawSqlMigration resolves it with no environment_id) - only offer it there. */}
          {activeTab === 0 && (
            <Button
              variant="outline"
              leadingVisual={<Plus />}
              onClick={() =>
                runMigration({
                  run: () => Promise.resolve({}),
                  tableId: selectedTable?.id,
                  showSqlEditor: true,
                  // The SQL is the whole migration: there is no structured change to fall back on.
                  sqlRequired: true,
                  changes: [],
                  modalTitle: 'New migration',
                  titlePlaceholder: 'Explain your changes briefly..',
                  // The migration ran against development - refetchMigrations only updates this
                  // drawer's list. switchEnvironment re-triggers Table/index.jsx's registered
                  // handler, which reloads both the grid rows and column metadata for that env
                  // (same mechanism PromotePreviewView.runPromote uses below).
                  onSuccess: () => {
                    refetchMigrations();
                    switchEnvironment(allEnvironments[activeTab]);
                  },
                })
              }
              data-cy="new-migration-button"
            >
              New migration
            </Button>
          )}
          {canPromote && (
            <Button
              trailingVisual={<ArrowRight />}
              onClick={() =>
                setPromoteTarget({
                  sourceEnvironment: allEnvironments[activeTab],
                  environment: nextEnv,
                  sourceHeadId: headMigrationId,
                })
              }
              data-cy="migration-history-promote-button"
            >
              Run in {nextEnv.name}
            </Button>
          )}
        </footer>
        {newMigrationModal}
      </div>
    </Drawer>
  );
};

const PromotePreviewView = ({
  promoteTarget,
  organizationId,
  tableId,
  tableName,
  onBack,
  onClose,
  refetchMigrations,
  refetchTables,
}) => {
  const { sourceEnvironment, environment } = promoteTarget;
  const [pendingMigrations, setPendingMigrations] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { switchEnvironment } = useTjdbActions();

  useEffect(() => {
    tooljetDatabaseService
      .previewPromoteTable(organizationId, tableId, sourceEnvironment.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error(error?.message || 'Could not load the migration preview', { position: 'top-center' });
          return;
        }
        setPendingMigrations(data?.result?.missing_migrations ?? []);
      });
  }, [organizationId, tableId, sourceEnvironment.id]);

  const runPromote = () => {
    setIsRunning(true);
    tooljetDatabaseService.promoteTable(organizationId, tableId, sourceEnvironment.id).then(({ error }) => {
      setIsRunning(false);
      if (error) {
        toast.error(error?.message || `Could not run migrations in ${environment.name}`, { position: 'top-center' });
        refetchMigrations();
        refetchTables?.();
        return;
      }
      toast.success(`Migrations applied to ${environment.name}`, { position: 'top-center' });
      refetchMigrations();
      refetchTables?.();
      switchEnvironment(environment);
      onBack();
    });
  };

  // The backup is the target environment's rows as CSV - the data the pending migrations are about to change.
  const downloadBackup = () => {
    setIsBackingUp(true);
    tooljetDatabaseService
      .exportTableCsv(tableId, environment.id)
      .then((blob) => generateFile(`${tableName}-${environment.name}-backup.csv`, blob, 'csv'))
      .catch((err) => toast.error(err?.message ?? 'Could not download backup', { position: 'top-center' }))
      .finally(() => setIsBackingUp(false));
  };

  const count = pendingMigrations?.length ?? 0;

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-bg-background-surface-layer-01" data-cy="migration-promote-view">
      <header className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-py-0 tw-pl-2 tw-pr-3">
        <Button variant="ghost" iconOnly size="medium" aria-label="Back" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h2 className="tw-m-0 tw-min-w-0 tw-flex-1 tw-truncate tw-font-title-x-large tw-text-text-default">
          Run migrations in {environment.name}
        </h2>
        <Button variant="ghost" iconOnly size="medium" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div
        className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-4 ${ROCKET_SCROLLBAR}`}
      >
        {pendingMigrations === null ? (
          <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">Loading…</p>
        ) : (
          <>
            <p className="tw-m-0 tw-font-body-default tw-text-text-medium">
              The following{' '}
              <span className="tw-font-title-default tw-text-text-default">
                {count} migration{count === 1 ? '' : 's'}
              </span>{' '}
              will be applied to the {environment.name} table.
            </p>
            <div className="tw-flex tw-items-start tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-px-3 tw-py-2">
              <TriangleAlert aria-hidden className="tw-mt-px tw-size-4 tw-shrink-0 tw-text-icon-warning" />
              <p className="tw-m-0 tw-font-body-default tw-text-text-default">
                Migrations can cause loss of data. Download a backup before proceeding.
              </p>
            </div>
            <div>
              {pendingMigrations.map((migration, index) => (
                <MigrationTimelineItem
                  key={migration.id}
                  number={formatMigrationNumber(migration.migration_number)}
                  title={migration.name || formatMigrationNumber(migration.migration_number)}
                  description={migration.description}
                  date={formatTimestamp(migration.created_at)}
                  sql={migration.sql}
                  applied
                  latest={false}
                  hereLabel={null}
                  // The SQL is what is about to run, so it is shown rather than behind a button.
                  expanded
                  onToggleSql={() => {}}
                  last={index === pendingMigrations.length - 1}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
        <Button variant="outline" leadingVisual={<Download />} onClick={downloadBackup} loading={isBackingUp}>
          Download backup
        </Button>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button
            trailingVisual={<ArrowRight />}
            onClick={runPromote}
            disabled={isRunning || !count}
            loading={isRunning}
            data-cy="migration-promote-run"
          >
            Run in {environment.name}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default MigrationHistoryDrawer;
