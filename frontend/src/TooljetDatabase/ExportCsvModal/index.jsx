import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { Download, TriangleAlert, X } from 'lucide-react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/Rocket/RadioGroup/RadioGroup';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Rocket/Tooltip/Tooltip';
import { tooljetDatabaseService } from '@/_services';
import { envHasRelation, headMigrationLabel, TABLE_ABSENT_TOOLTIP } from '../constants';
import generateFile from '@/_lib/generate-file';
import { useTjdbStore } from '../_stores/tjdbStore';

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
    // Start on the environment being viewed; fall back to the first one that has the table.
    const viewedEnvironmentId = useTjdbStore.getState().selectedEnvironment?.id;
    setSelectedEnvironmentId(
      envHasRelation(relationsByEnvironment, viewedEnvironmentId)
        ? viewedEnvironmentId
        : (environments.find((env) => envHasRelation(relationsByEnvironment, env.id))?.id ?? null)
    );

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
    // relationsByEnvironment only changes via a promote (useTableMigrations.refetchTables, called
    // from PromotePreviewView after promoteTable succeeds), and a promote is only reachable from
    // inside MigrationHistoryDrawer. That drawer and this modal cannot both be open: both are
    // full-viewport, focus-trapped overlays (Rocket Dialog and the drawer's own backdrop) that swallow
    // every click/keystroke meant for whatever triggers the other. If that stacking
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
    <Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        size="small"
        showCloseButton={false}
        className={cx({ 'dark-theme theme-dark': darkMode })}
        data-cy="export-csv-modal"
      >
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
          <DialogTitle className="tw-min-w-0 tw-flex-1 tw-font-title-heavy-large">
            Select an environment to export data
          </DialogTitle>
          <Button
            variant="ghost"
            iconOnly
            size="default"
            aria-label="Close"
            onClick={onCancel}
            data-cy="export-csv-modal-close"
          >
            <X />
          </Button>
        </div>

        <DialogBody scrollable noPadding className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
          <RadioGroup
            value={selectedEnvironmentId ?? ''}
            onValueChange={setSelectedEnvironmentId}
            aria-label="Environment"
            className="tw-gap-1"
          >
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
              const inputId = `export-csv-${environment.id}`;
              const row = (
                <label
                  htmlFor={inputId}
                  className={cx(
                    'tw-m-0 tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2',
                    disabled ? 'tw-cursor-not-allowed tw-opacity-50' : 'tw-cursor-pointer hover:tw-bg-interactive-hover'
                  )}
                  data-cy={`export-csv-${environment.name}-option`}
                >
                  <RadioGroupItem id={inputId} value={environment.id} disabled={disabled} />
                  <span className="tw-flex tw-flex-col">
                    <span className="tw-font-title-default tw-text-text-default">{environment.name}</span>
                    <span className="tw-flex tw-items-center tw-gap-1 tw-font-body-small tw-text-text-placeholder">
                      {label ?? '—'} |{' '}
                      {disabled ? (
                        '—'
                      ) : count === undefined ? (
                        <Skeleton className="tw-inline-block tw-h-3 tw-w-8" />
                      ) : (
                        `${count ?? '—'} rows`
                      )}
                    </span>
                  </span>
                </label>
              );
              if (!disabled) return <React.Fragment key={environment.id}>{row}</React.Fragment>;
              return (
                <TooltipProvider key={environment.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{row}</div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{TABLE_ABSENT_TOOLTIP}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </RadioGroup>

          {selectedEnvironmentId && rowCounts[selectedEnvironmentId] > 50000 && (
            <div
              className="tw-flex tw-items-start tw-gap-1.5 tw-rounded-md tw-bg-background-warning-weak tw-px-3 tw-py-2"
              data-cy="export-csv-warning"
            >
              <TriangleAlert aria-hidden className="tw-mt-px tw-size-4 tw-shrink-0 tw-text-icon-warning" />
              <p className="tw-m-0 tw-font-body-default tw-text-text-default">
                This table contains a large number of rows ({rowCounts[selectedEnvironmentId]}). Exporting may take some
                time and consume significant memory.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="tw-border-border-weak tw-px-4 tw-py-3">
          <Button variant="outline" onClick={onCancel} disabled={exporting} data-cy="export-csv-modal-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            loading={exporting}
            disabled={!selectedEnvironmentId}
            leadingVisual={<Download />}
            data-cy="export-csv-modal-confirm"
          >
            Export as CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
