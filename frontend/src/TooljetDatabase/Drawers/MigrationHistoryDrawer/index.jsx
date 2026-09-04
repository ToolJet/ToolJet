import React, { useEffect, useMemo, useState } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import { tooljetDatabaseService } from '@/_services';
import { ArrowLeft, Download, CodeXml } from 'lucide-react';
import SqlEditor from '../../_components/SqlEditor';
import { useTjdbStore, useTjdbActions } from '../../_stores/tjdbStore';
import './styles.scss';

const TAB_LABELS = ['Development', 'Staging', 'Production'];

const ReadOnlySqlView = ({ sql }) => <SqlEditor value={sql} dataCy="migration-history-sql-view" />;

function formatTimestamp(date) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
}

function statusLine(tabIndex, chainLength, appliedCount) {
  const behindCount = chainLength - appliedCount;
  if (tabIndex === 0) return `Development is ${behindCount} migration${behindCount === 1 ? '' : 's'} ahead of staging`;
  if (tabIndex === 1) return `Staging is ${behindCount} migration${behindCount === 1 ? '' : 's'} ahead of production`;
  return 'Production is not up to date with latest changes. Apply migration from development to staging, and then to production to see them reflected here.';
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

  // Open on whichever environment the switcher is currently viewing, not always Development.
  useEffect(() => {
    if (!isOpen) return;
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
  const headMigrationId = [...appliedIds].reverse().find((id) => migrations.some((m) => m.id === id)) ?? null;

  const nextEnv = allEnvironments[activeTab + 1];
  const nextEnvState = nextEnv ? envStateByPriorityIndex[activeTab + 1] : null;
  const nextEnvBehind = nextEnv && (nextEnvState?.applied_migration_ids?.length ?? 0) < appliedCount;
  const canPromote = activeTab < allEnvironments.length - 1 && nextEnv && nextEnvBehind;

  const handleClose = () => {
    setExpandedMigrationId(null);
    setPromoteTarget(null);
    onClose();
  };

  if (promoteTarget) {
    return (
      <Drawer isOpen={isOpen} onClose={handleClose} position="right" className="tj-db-drawer">
        <PromotePreviewView
          promoteTarget={promoteTarget}
          organizationId={organizationId}
          tableId={selectedTable?.id}
          onBack={() => setPromoteTarget(null)}
          onClose={handleClose}
          refetchMigrations={refetchMigrations}
          refetchTables={refetchTables}
        />
      </Drawer>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} position="right" className="tj-db-drawer">
      <div className="migration-history-drawer">
        <div className="migration-history-drawer__header">
          <span>Migration history</span>
          <button className="migration-history-drawer__close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="migration-history-drawer__tabs">
          {TAB_LABELS.map((label, index) => {
            const licensed = index < allEnvironments.length;
            const hasRelation =
              licensed &&
              (relationsByEnvironment.find((r) => r.environment_id === allEnvironments[index].id)?.has_relation ??
                false);
            const available = licensed && hasRelation;
            const tab = (
              <button
                key={label}
                className={cx('migration-history-drawer__tab', { active: index === activeTab, disabled: !available })}
                disabled={!available}
                onClick={() => available && setActiveTab(index)}
              >
                {label}
              </button>
            );
            if (available) return tab;
            const tooltipMessage = licensed
              ? 'Table does not exist in this environment'
              : "Your plan doesn't support multiple environments";
            return (
              <ToolTip key={label} message={tooltipMessage} placement="top">
                <div>{tab}</div>
              </ToolTip>
            );
          })}
        </div>

        <div className="migration-history-drawer__status">
          <span className="migration-history-drawer__status-label">STATUS</span>
          <p>{statusLine(activeTab, chainLength, appliedCount)}</p>
        </div>

        <div className="migration-history-drawer__list">
          {reversedMigrations.map((migration) => {
            const isApplied = appliedIds.includes(migration.id);
            const isExpanded = expandedMigrationId === migration.id;
            return (
              <div key={migration.id} className={cx('migration-history-drawer__row', { disabled: !isApplied })}>
                <div className="migration-history-drawer__row-marker" />
                <div className="migration-history-drawer__row-content">
                  <div className="migration-history-drawer__row-title">
                    <span>m{migrations.findIndex((m) => m.id === migration.id) + 1}</span>
                    {migration.id === latestMigrationId && (
                      <span className="migration-history-drawer__badge latest">Latest</span>
                    )}
                    {migration.id === headMigrationId && (
                      <span className="migration-history-drawer__badge here">{TAB_LABELS[activeTab]} is here</span>
                    )}
                  </div>
                  {migration.name && <div className="migration-history-drawer__row-name">{migration.name}</div>}
                  <div className="migration-history-drawer__row-timestamp">
                    {formatTimestamp(migration.createdAt ?? migration.created_at)}
                  </div>
                  {isExpanded && <ReadOnlySqlView sql={migration.sql} />}
                </div>
                <button
                  className={cx('migration-history-drawer__code-button', { active: isExpanded })}
                  onClick={() => setExpandedMigrationId(isExpanded ? null : migration.id)}
                >
                  <CodeXml size={16} className="migration-history-drawer__code-icon" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="migration-history-drawer__footer">
          {canPromote && (
            <ButtonSolid
              onClick={() =>
                setPromoteTarget({
                  sourceEnvironment: allEnvironments[activeTab],
                  environment: nextEnv,
                  sourceHeadId: headMigrationId,
                })
              }
            >
              Run in {nextEnv.name}
            </ButtonSolid>
          )}
        </div>
      </div>
    </Drawer>
  );
};

const PromotePreviewView = ({
  promoteTarget,
  organizationId,
  tableId,
  onBack,
  onClose,
  refetchMigrations,
  refetchTables,
}) => {
  const { sourceEnvironment, environment } = promoteTarget;
  const [pendingMigrations, setPendingMigrations] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
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
        return;
      }
      toast.success(`Migrations applied to ${environment.name}`, { position: 'top-center' });
      refetchMigrations();
      refetchTables?.();
      switchEnvironment(environment);
      onBack();
    });
  };

  const latest = pendingMigrations?.[pendingMigrations.length - 1];

  return (
    <div className="migration-history-drawer">
      <div className="migration-history-drawer__header">
        <button className="migration-history-drawer__back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span>
          Run {latest?.name || 'migration'} in {environment.name}
        </span>
        <button className="migration-history-drawer__close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="migration-history-drawer__detail-body">
        {pendingMigrations === null ? (
          <p>Loading…</p>
        ) : (
          <>
            <p>
              The following{' '}
              <strong>
                {pendingMigrations.length} migration{pendingMigrations.length === 1 ? '' : 's'}
              </strong>{' '}
              will be applied to the {environment.name} table. Migration can cause loss of data, it is recommended to
              download backup before proceeding.
            </p>
            {pendingMigrations.map((migration) => (
              <div key={migration.id} className="migration-history-drawer__preview-item">
                <div className="migration-history-drawer__row-title">
                  <span>{migration.name || migration.id}</span>
                </div>
                <div className="migration-history-drawer__row-timestamp">{formatTimestamp(migration.created_at)}</div>
                <ReadOnlySqlView sql={migration.sql} />
              </div>
            ))}
          </>
        )}
      </div>
      <div className="migration-history-drawer__footer migration-history-drawer__footer--promote">
        <ButtonSolid
          variant="secondary"
          // ponytail: real table-data backup/export doesn't exist yet — this button matches the
          // approved design but is intentionally inert until that feature is built.
          onClick={() => toast('Backing up table data isn’t available yet', { position: 'top-center' })}
        >
          <Download size={16} /> Download backup
        </ButtonSolid>
        <div className="migration-history-drawer__footer-actions">
          <ButtonSolid variant="tertiary" onClick={onBack}>
            Cancel
          </ButtonSolid>
          <ButtonSolid onClick={runPromote} disabled={isRunning || !pendingMigrations?.length} isLoading={isRunning}>
            Run in {environment.name}
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
};

export default MigrationHistoryDrawer;
