import React, { useContext, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { capitalize } from 'lodash';
import { Overlay, Popover } from 'react-bootstrap';
import { IconChevronRight } from '@tabler/icons-react';
import { TooljetDatabaseContext } from '../context';
import { tooljetDatabaseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import './styles.scss';
import { History } from 'lucide-react';
import MigrationHistoryDrawer from '../Drawers/MigrationHistoryDrawer';

/**
 * Per-environment status for the currently open table, derived from two backend shapes:
 * - `tables` (view_tables, context) gives `has_relation`/`baseline_error` per environment for every
 *   table - used here for the gray "no relation" state.
 * - `getTableMigrations` (per table) gives the full migration chain plus, per environment, which of
 *   those are confirmed applied - used for the last-applied-migration-name badge and the blue/orange
 *   split.
 * Never conflate `baseline_error` with "no relation" (see H8 plan) - a table with baseline_error
 * still has a relation and is editable, so it's excluded from the gray predicate on purpose.
 *
 * No table open (`hasTableContext` false, e.g. the table list view): nothing to report per
 * environment yet, so only the selected row reads as blue - every other row is a neutral gray, not
 * a real "no relation" signal.
 */
const lastAppliedMigrationName = (migrations, appliedMigrationIds) => {
  if (!appliedMigrationIds?.length) return null;
  // `migrations` is sequence-ASC (server: `order: { sequence: 'ASC', id: 'ASC' }`), so the last
  // entry whose id is in the applied set is the most recently applied one.
  for (let i = migrations.length - 1; i >= 0; i--) {
    if (appliedMigrationIds.includes(migrations[i].id)) return migrations[i].name;
  }
  return null;
};

const deriveEnvironmentStatus = (isSelected, hasTableContext, hasRelation, migrationState, chainLength, migrations) => {
  if (!hasTableContext) return { dot: isSelected ? 'synced' : 'absent', lastMigrationName: null };
  if (!hasRelation) return { dot: 'absent', lastMigrationName: null };
  const appliedCount = migrationState?.applied_migration_ids?.length ?? 0;
  const isBehind = chainLength > 0 && appliedCount < chainLength;
  const lastMigrationName = lastAppliedMigrationName(migrations, migrationState?.applied_migration_ids);
  return { dot: isSelected || !isBehind ? 'synced' : 'behind', lastMigrationName };
};

const EnvironmentSwitcher = () => {
  const { organizationId, tables, selectedTable, environments, selectedEnvironment, setSelectedEnvironment } =
    useContext(TooljetDatabaseContext);
  const [isOpen, setIsOpen] = useState(false);
  const [tableMigrations, setTableMigrations] = useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const buttonRef = useRef(null);

  const fetchTableMigrations = React.useCallback(() => {
    if (!organizationId || !selectedTable?.id) {
      setTableMigrations(null);
      return;
    }
    tooljetDatabaseService.getTableMigrations(organizationId, selectedTable.id).then(({ data, error }) => {
      if (error) return;
      setTableMigrations(data?.result ?? null);
    });
  }, [organizationId, selectedTable?.id]);

  useEffect(() => {
    setTableMigrations(null);
    fetchTableMigrations();
  }, [fetchTableMigrations]);

  if (environments.length <= 1 || !selectedEnvironment) return null;

  const hasTableContext = !!selectedTable?.id;
  const relationsByEnvironment = tables?.find((table) => table.id === selectedTable?.id)?.environments ?? [];
  const migrations = tableMigrations?.migrations ?? [];
  const chainLength = migrations.length;

  const statusFor = (environment) => {
    const isSelected = environment.id === selectedEnvironment.id;
    const hasRelation = relationsByEnvironment.find((r) => r.environment_id === environment.id)?.has_relation ?? false;
    const migrationState = tableMigrations?.environments?.find((e) => e.environment_id === environment.id);
    return {
      ...deriveEnvironmentStatus(isSelected, hasTableContext, hasRelation, migrationState, chainLength, migrations),
      hasRelation,
    };
  };

  const selectedStatus = statusFor(selectedEnvironment);

  const openMigrationHistory = () => setIsHistoryDrawerOpen(true);

  return (
    <div className="tjdb-environment-switcher d-flex align-items-center gap-2">
      <button
        ref={buttonRef}
        className={cx('btn tjdb-environment-switcher__button', { opened: isOpen })}
        onClick={() => setIsOpen((prev) => !prev)}
        data-cy="tjdb-environment-switcher-button"
      >
        <div className={cx('tjdb-environment-switcher__dot', selectedStatus.dot)} />
        {selectedStatus.lastMigrationName && (
          <span className="tjdb-environment-switcher__badge">{selectedStatus.lastMigrationName}</span>
        )}
        <div className="tjdb-environment-switcher__divider" />
        <span className="tjdb-environment-switcher__name" data-cy={`${selectedEnvironment.name}-environment-name`}>
          {capitalize(selectedEnvironment.name)}
        </span>
      </button>

      <button
        className="btn tjdb-environment-switcher__history-button"
        onClick={openMigrationHistory}
        title="Migration history"
        data-cy="tjdb-migration-history-button"
      >
        <History width="16" height="16" className="tw-text-icon-strong" />
      </button>

      <Overlay
        show={isOpen}
        target={buttonRef.current}
        placement="bottom-end"
        rootClose
        onHide={() => setIsOpen(false)}
        popperConfig={{
          modifiers: [
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
            { name: 'offset', options: { offset: [0, 4] } },
          ],
        }}
      >
        {(overlayProps) => (
          <Popover {...overlayProps} className="tjdb-environment-switcher__popover">
            <Popover.Body>
              {environments.map((environment) => {
                const isSelected = environment.id === selectedEnvironment.id;
                const status = statusFor(environment);
                // A table open, and absent here: switching to this environment can't show it.
                const disabled = hasTableContext && !status.hasRelation && !isSelected;
                const row = (
                  <button
                    key={environment.id}
                    className={cx('tjdb-environment-switcher__row', { disabled })}
                    disabled={disabled}
                    onClick={() => {
                      setSelectedEnvironment(environment);
                      setIsOpen(false);
                    }}
                    data-cy={`${environment.name}-environment-option`}
                  >
                    <span className="tjdb-environment-switcher__row-check">
                      {isSelected && <SolidIcon name="check2" width="16" height="16" fill="var(--indigo9)" />}
                    </span>
                    <span className="tjdb-environment-switcher__row-content">
                      <span className="tjdb-environment-switcher__row-dot-wrap">
                        <div className={cx('tjdb-environment-switcher__dot', status.dot)} />
                      </span>
                      <span className="tjdb-environment-switcher__row-name">{capitalize(environment.name)}</span>
                    </span>
                    {status.lastMigrationName && (
                      <span className="tjdb-environment-switcher__row-badge">{status.lastMigrationName}</span>
                    )}
                  </button>
                );
                if (!disabled) return row;
                return (
                  <ToolTip key={environment.id} message="Table does not exist in this environment" placement="left">
                    <div>{row}</div>
                  </ToolTip>
                );
              })}
              <button className="tjdb-environment-switcher__footer" onClick={openMigrationHistory}>
                View migration history
                <IconChevronRight size={12} stroke={1.75} />
              </button>
            </Popover.Body>
          </Popover>
        )}
      </Overlay>

      <MigrationHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        migrations={migrations}
        environments={tableMigrations?.environments ?? []}
        allEnvironments={environments}
        organizationId={organizationId}
        selectedTable={selectedTable}
        refetchMigrations={fetchTableMigrations}
      />
    </div>
  );
};

export default EnvironmentSwitcher;
