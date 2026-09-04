import React, { useMemo, useState } from 'react';
import cx from 'classnames';
import Drawer from '@/_ui/Drawer';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import MultiLineCodeEditor from '@/AppBuilder/CodeEditor/MultiLineCodeEditor';
import { ArrowLeft } from 'lucide-react';
import './styles.scss';

const TAB_LABELS = ['Development', 'Staging', 'Production'];

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
  organizationId,
  selectedTable,
  refetchMigrations,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [detailMigration, setDetailMigration] = useState(null);
  const [promoteTarget, setPromoteTarget] = useState(null);

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
    setDetailMigration(null);
    setPromoteTarget(null);
    onClose();
  };

  if (detailMigration) {
    return (
      <Drawer isOpen={isOpen} onClose={handleClose} position="right" className="tj-db-drawer migration-history-drawer">
        <MigrationDetailView
          migration={detailMigration}
          onBack={() => setDetailMigration(null)}
          onClose={handleClose}
        />
      </Drawer>
    );
  }

  if (promoteTarget) {
    return (
      <Drawer isOpen={isOpen} onClose={handleClose} position="right" className="tj-db-drawer migration-history-drawer">
        <PromotePreviewView
          promoteTarget={promoteTarget}
          organizationId={organizationId}
          tableId={selectedTable?.id}
          onBack={() => setPromoteTarget(null)}
          onClose={handleClose}
          refetchMigrations={refetchMigrations}
        />
      </Drawer>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} position="right" className="tj-db-drawer migration-history-drawer">
      <div className="migration-history-drawer__header">
        <span>Migration history</span>
        <button className="migration-history-drawer__close" onClick={handleClose}>
          &times;
        </button>
      </div>

      <div className="migration-history-drawer__tabs">
        {TAB_LABELS.map((label, index) => {
          const available = index < allEnvironments.length;
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
          return (
            <ToolTip key={label} message="Your plan doesn't support multiple environments" placement="top">
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
                  {new Date(migration.createdAt ?? migration.created_at).toLocaleString()}
                </div>
              </div>
              <button className="migration-history-drawer__code-button" onClick={() => setDetailMigration(migration)}>
                {'</>'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="migration-history-drawer__footer">
        {canPromote && (
          <ButtonSolid onClick={() => setPromoteTarget({ environment: nextEnv, sourceHeadId: headMigrationId })}>
            Run in {nextEnv.name}
          </ButtonSolid>
        )}
      </div>
    </Drawer>
  );
};

const MigrationDetailView = ({ migration, onBack, onClose }) => (
  <>
    <div className="migration-history-drawer__header">
      <button className="migration-history-drawer__back" onClick={onBack}>
        <ArrowLeft size={18} />
      </button>
      <span>{migration.name || 'Migration'}</span>
      <button className="migration-history-drawer__close" onClick={onClose}>
        &times;
      </button>
    </div>
    <div className="migration-history-drawer__detail-body">
      <div className="migration-history-drawer__row-timestamp">
        {new Date(migration.createdAt ?? migration.created_at).toLocaleString()}
      </div>
      <MultiLineCodeEditor
        lang="sql"
        initialValue={migration.sql || '-- No SQL available for this migration'}
        readOnly
        editable={false}
        lineNumbers
        foldGutter={false}
        height="auto"
      />
    </div>
  </>
);
const PromotePreviewView = ({ promoteTarget, organizationId, tableId, onBack, onClose, refetchMigrations }) => null; // Task 7 fills this in

export default MigrationHistoryDrawer;
