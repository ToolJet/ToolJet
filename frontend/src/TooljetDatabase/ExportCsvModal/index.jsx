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
import { headMigrationLabel } from '../constants';

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

  const hasRelation = (environmentId) =>
    relationsByEnvironment.find((r) => r.environment_id === environmentId)?.has_relation ?? false;

  useEffect(() => {
    if (!show) return;
    setMigrationsData(null);
    setRowCounts({});
    setExporting(false);
    setSelectedEnvironmentId(environments.find((env) => hasRelation(env.id))?.id ?? null);

    tooljetDatabaseService.getTableMigrations(organizationId, tableId).then(({ data, error }) => {
      if (error) return;
      setMigrationsData(data?.result ?? null);
    });

    environments
      .filter((env) => hasRelation(env.id))
      .forEach((env) => {
        tooljetDatabaseService.getTableRowCount(tableId, env.id).then(({ count, error }) => {
          setRowCounts((prev) => ({ ...prev, [env.id]: error ? null : count }));
        });
      });
    // Deliberately keyed on show/tableId only - re-fetching on every environments/relations
    // reference change would refire three requests for no reason; those only change alongside a
    // table switch anyway, which already remounts this modal closed.
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
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `${tableName}-${environment?.name ?? 'export'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
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
      size="lg"
      animation={false}
      centered
      contentClassName={cx('migration-confirm-modal', { 'dark-theme': darkMode })}
      data-cy="export-csv-modal"
    >
      <Modal.Header closeButton={false}>
        <Modal.Title>Select an environment to export data</Modal.Title>
        <span className="cursor-pointer" onClick={onCancel} data-cy="export-csv-modal-close">
          <SolidIcon name="remove" width="16" fill="#889096" />
        </span>
      </Modal.Header>
      <Modal.Body className="migration-confirm-modal-body">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {environments.map((environment) => {
            const disabled = !hasRelation(environment.id);
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
                  'tw-flex tw-items-center tw-gap-2 tw-rounded tw-border tw-border-solid tw-border-[var(--borders-disabled-on-white)] tw-p-2',
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
              <ToolTip key={environment.id} message="Table does not exist in this environment" placement="top">
                <div>{row}</div>
              </ToolTip>
            );
          })}
        </div>
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
