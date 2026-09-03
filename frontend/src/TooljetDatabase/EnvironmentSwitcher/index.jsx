import React, { useContext, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { capitalize } from 'lodash';
import { Overlay, Popover } from 'react-bootstrap';
import { IconHistory, IconChevronRight } from '@tabler/icons-react';
import { TooljetDatabaseContext } from '../context';
import { tooljetDatabaseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';

/**
 * Per-environment status for the currently open table, derived from two backend shapes:
 * - `tables` (view_tables, context) gives `has_relation`/`baseline_error` per environment for every
 *   table - used here for the gray "no relation" state.
 * - `getTableMigrations` (per table) gives the full migration chain length plus, per environment,
 *   how many of those are confirmed applied - used for the `mN` badge and the blue/orange split.
 * Never conflate `baseline_error` with "no relation" (see H8 plan) - a table with baseline_error
 * still has a relation and is editable, so it's excluded from the gray predicate on purpose.
 *
 * No table open (`hasTableContext` false, e.g. the table list view): nothing to report per
 * environment yet, so only the selected row reads as blue - every other row is a neutral gray, not
 * a real "no relation" signal.
 */
const deriveEnvironmentStatus = (isSelected, hasTableContext, hasRelation, migrationState, chainLength) => {
  if (!hasTableContext) return { dot: isSelected ? 'synced' : 'absent', appliedCount: null };
  if (!hasRelation) return { dot: 'absent', appliedCount: null };
  const appliedCount = migrationState?.applied_migration_ids?.length ?? 0;
  const isBehind = chainLength > 0 && appliedCount < chainLength;
  return { dot: isSelected || !isBehind ? 'synced' : 'behind', appliedCount };
};

const EnvironmentSwitcher = () => {
  const { organizationId, tables, selectedTable, environments, selectedEnvironment, setSelectedEnvironment } =
    useContext(TooljetDatabaseContext);
  const [isOpen, setIsOpen] = useState(false);
  const [tableMigrations, setTableMigrations] = useState(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setTableMigrations(null);
    if (!organizationId || !selectedTable?.id) return;
    tooljetDatabaseService.getTableMigrations(organizationId, selectedTable.id).then(({ data, error }) => {
      if (error) return;
      setTableMigrations(data?.result ?? null);
    });
  }, [organizationId, selectedTable?.id]);

  if (environments.length <= 1 || !selectedEnvironment) return null;

  const hasTableContext = !!selectedTable?.id;
  const relationsByEnvironment = tables?.find((table) => table.id === selectedTable?.id)?.environments ?? [];
  const chainLength = tableMigrations?.migrations?.length ?? 0;

  const statusFor = (environment) => {
    const isSelected = environment.id === selectedEnvironment.id;
    const hasRelation = relationsByEnvironment.find((r) => r.environment_id === environment.id)?.has_relation ?? false;
    const migrationState = tableMigrations?.environments?.find((e) => e.environment_id === environment.id);
    return deriveEnvironmentStatus(isSelected, hasTableContext, hasRelation, migrationState, chainLength);
  };

  const selectedStatus = statusFor(selectedEnvironment);

  // TODO(Task 12): open the migration-history drawer for selectedTable. No-op until that drawer exists.
  const openMigrationHistory = () => {};

  return (
    <div className="tjdb-environment-switcher d-flex align-items-center gap-2">
      <button
        ref={buttonRef}
        className={cx('btn tjdb-environment-switcher__button', { opened: isOpen })}
        onClick={() => setIsOpen((prev) => !prev)}
        data-cy="tjdb-environment-switcher-button"
      >
        <div className={cx('tjdb-environment-switcher__dot', selectedStatus.dot)} />
        {selectedStatus.appliedCount !== null && (
          <span className="tjdb-environment-switcher__badge">m{selectedStatus.appliedCount}</span>
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
        <IconHistory size={16} stroke={1.75} />
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
                return (
                  <button
                    key={environment.id}
                    className="tjdb-environment-switcher__row"
                    onClick={() => {
                      setSelectedEnvironment(environment);
                      setIsOpen(false);
                    }}
                    data-cy={`${environment.name}-environment-option`}
                  >
                    <span className="tjdb-environment-switcher__row-check">
                      {isSelected && <SolidIcon name="check2" width="14" height="14" fill="var(--indigo9)" />}
                    </span>
                    <div className={cx('tjdb-environment-switcher__dot', status.dot)} />
                    <span className="tjdb-environment-switcher__row-name">{capitalize(environment.name)}</span>
                    {status.appliedCount !== null && (
                      <span className="tjdb-environment-switcher__row-badge">m{status.appliedCount}</span>
                    )}
                  </button>
                );
              })}
              <div className="tjdb-environment-switcher__footer-divider" />
              <button className="tjdb-environment-switcher__footer" onClick={openMigrationHistory}>
                View migration history
                <IconChevronRight size={16} stroke={1.75} />
              </button>
            </Popover.Body>
          </Popover>
        )}
      </Overlay>
    </div>
  );
};

export default EnvironmentSwitcher;
