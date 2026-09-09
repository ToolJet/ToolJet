import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import { Download } from 'lucide-react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import { tooljetDatabaseService } from '@/_services';
import { envHasRelation, headMigrationLabel, TABLE_ABSENT_TOOLTIP } from '../constants';
import generateFile from '@/_lib/generate-file';
import '../MigrationConfirmModal/styles.scss';

/**
 * Environment picker for a data export. Row counts and the head-migration label are read once per
 * environment when the modal opens (getTableMigrations for the chain, one getTableRowCount per
 * environment in parallel) - there is no bulk endpoint for either. A failed row count degrades to
 * "—", it never blocks picking that environment or exporting it.
 */
export default function ExportCsvModal({
  show,
  darkMode,
  tableName,
  tableId,
  organizationId,
  environments = [],
  relationsByEnvironment = [],
  onCancel,
}) {
  const [migrationsData, setMigrationsData] = useState(null);
  const [rowCounts, setRowCounts] = useState({});
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setMigrationsData(null);
    setRowCounts({});
    setExporting(false);
    setSelectedEnvironmentId(environments.find((env) => envHasRelation(relationsByEnvironment, env.id))?.id ?? null);

    tooljetDatabaseService.getTableMigrations(organizationId, tableId).then(({ data, error }) => {
      if (error) return;
      setMigrationsData(data?.result ?? null);
    });

    environments
      .filter((env) => envHasRelation(relationsByEnvironment, env.id))
      .forEach((env) => {
        tooljetDatabaseService.getTableRowCount(tableId, env.id).then(({ count, error }) => {
          setRowCounts((prev) => ({ ...prev, [env.id]: error ? null : count }));
        });
      });
    // Deliberately keyed on show/tableId only, not on environments/relationsByEnvironment -
    // relationsByEnvironment only changes via a promote (EnvironmentSwitcher.refetchTables, called
    // from PromotePreviewView after promoteTable succeeds), and a promote is only reachable from
    // inside MigrationHistoryDrawer. That drawer and this modal cannot both be open: both are
    // full-viewport, focus-trapped overlays (react-bootstrap Modal backdrop z-index ~1040+;
    // Drawer's own backdrop, frontend/src/_styles/drawer.scss, z-index 999, pointer-events: auto)
    // that swallow every click/keystroke meant for whatever triggers the other. If that stacking
    // ever changes (e.g. this modal or the drawer stops blocking the rest of the page), this effect
    // needs relationsByEnvironment back in its deps - a stale row would otherwise sit on its
    // skeleton (or a stale head-migration label) until the next open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, tableId, organizationId]);

  const handleExport = () => {
    if (!selectedEnvironmentId || exporting) return;
    const environment = environments.find((env) => env.id === selectedEnvironmentId);
    setExporting(true);
    toast.loading('Exporting table…', { id: 'tjdb-csv-export' });
    tooljetDatabaseService
      .exportTableCsv(tableId, selectedEnvironmentId)
      .then((blob) => {
        generateFile(`${tableName}-${environment?.name ?? 'export'}.csv`, blob, 'csv');
        toast.success('Table exported successfully', { id: 'tjdb-csv-export' });
        onCancel();
      })
      .catch((err) => {
        toast.error(err?.message ?? 'Could not export table', { id: 'tjdb-csv-export' });
      })
      .finally(() => setExporting(false));
  };

  return (
    <Modal
      show={show}
      onHide={onCancel}
      size="sm"
      animation={false}
      centered
      contentClassName={cx('migration-confirm-modal', { 'dark-theme': darkMode })}
      data-cy="export-csv-modal"
    >
      <Modal.Header closeButton={false}>
        <Modal.Title>Select an environment to export data</Modal.Title>
        <span className="cursor-pointer" onClick={onCancel} data-cy="export-csv-modal-close">
          <SolidIcon name="remove" width="16" fill="var(--slate11)" />
        </span>
      </Modal.Header>
      <Modal.Body className="migration-confirm-modal-body">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {environments.map((environment) => {
            const disabled = !envHasRelation(relationsByEnvironment, environment.id);
            const count = rowCounts[environment.id];
            const label = migrationsData
              ? headMigrationLabel(
                  migrationsData.migrations ?? [],
                  migrationsData.environments?.find((e) => e.environment_id === environment.id)
                    ?.applied_migration_ids ?? []
                )
              : null;
            const row = (
              <label
                key={environment.id}
                className={cx(
                  'tw-flex tw-items-center tw-gap-2 tw-rounded tw-p-2',
                  disabled ? 'tw-opacity-50 tw-cursor-not-allowed' : 'tw-cursor-pointer'
                )}
                data-cy={`export-csv-${environment.name}-option`}
              >
                <input
                  type="radio"
                  name="export-csv-environment"
                  disabled={disabled}
                  checked={selectedEnvironmentId === environment.id}
                  onChange={() => setSelectedEnvironmentId(environment.id)}
                />
                <div className="tw-flex tw-flex-col">
                  <span className="tw-font-medium">{environment.name}</span>
                  <span className="tw-text-placeholder tw-text-xs">
                    {label ?? '—'} |{' '}
                    {disabled ? (
                      '—'
                    ) : count === undefined ? (
                      <Skeleton width={30} height={12} inline />
                    ) : (
                      `${count ?? '—'} rows`
                    )}
                  </span>
                </div>
              </label>
            );
            if (!disabled) return row;
            return (
              <ToolTip key={environment.id} message={TABLE_ABSENT_TOOLTIP} placement="top" show>
                <div>{row}</div>
              </ToolTip>
            );
          })}
        </div>
        {selectedEnvironmentId && rowCounts[selectedEnvironmentId] > 50000 && (
          <div
            className="migration-deps-warning mt-3 mb-0 tw-text-orange-500 tw-bg-orange-50 tw-border-orange-200"
            data-cy="export-csv-warning"
          >
            This table contains a large number of rows ({rowCounts[selectedEnvironmentId]}). Exporting may take some
            time and consume significant memory.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <ButtonSolid variant="tertiary" onClick={onCancel} disabled={exporting} data-cy="export-csv-modal-cancel">
          Cancel
        </ButtonSolid>
        <ButtonSolid
          variant="primary"
          onClick={handleExport}
          isLoading={exporting}
          disabled={!selectedEnvironmentId}
          data-cy="export-csv-modal-confirm"
        >
          <Download size={16} /> Export as CSV
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}
