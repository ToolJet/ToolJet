import React from 'react';
import { Trash, TriangleAlert } from 'lucide-react';
import { InlineInfo } from '@/components/ui/Rocket';
import ActionDialog from '@/components/ui/Rocket/Dialog/ActionDialog';
import { DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import MigrationDependents from '../_components/MigrationDependents';

/**
 * Two states, driven entirely by props - the Tables panel (TableActionsHost) owns the dependents fetch and the delete
 * call. `loading` is the pre-check (getTableDependents); once it resolves, `blocked` decides which
 * body renders. Same dialog as Delete constant in workspace settings.
 */
export default function DeleteTableModal({
  show,
  tableName,
  loading,
  blocked,
  dependents,
  error,
  submitting,
  onConfirm,
  onCancel,
}) {
  const hasAppQueries = dependents?.count > 0;
  const foreignKeyTables = dependents?.foreignKeyTables ?? [];
  const hasFKs = foreignKeyTables.length > 0;

  const title = blocked
    ? hasAppQueries && hasFKs
      ? 'Dependent queries and tables found'
      : hasAppQueries
        ? 'Dependent queries found'
        : 'Referencing tables found'
    : 'Delete table?';

  return (
    <ActionDialog
      open={show}
      handleOpenChange={(next) => !next && onCancel()}
      classes={{ dialogContent: 'tw-max-w-[459px] tw-border-0', dialogBody: 'tw-pb-0' }}
      showCancelButton={!blocked}
      cancelBtnProps={{ onClick: onCancel, disabled: submitting, 'data-cy': 'delete-table-modal-cancel' }}
      submitActions={
        blocked
          ? [{ label: 'I understand', variant: 'primary', onClick: onCancel, 'data-cy': 'delete-table-understand' }]
          : [
              {
                label: 'Delete table',
                variant: 'dangerPrimary',
                isLoading: submitting,
                disabled: loading || submitting,
                onClick: onConfirm,
                'data-cy': 'delete-table-modal-confirm',
              },
            ]
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-2" data-cy="delete-table-modal">
        {blocked ? (
          <TriangleAlert size={40} className="tw-text-icon-warning" />
        ) : (
          <Trash size={40} className="tw-text-icon-danger" />
        )}
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <DialogTitle className="tw-font-title-x-large tw-text-text-default">{title}</DialogTitle>
          {loading ? (
            <MigrationDependents loading />
          ) : blocked ? (
            <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-default">
              Table <b>{tableName}</b> cannot be deleted because it is being used{' '}
              {hasAppQueries && hasFKs
                ? 'in an app, module, or a workflow, and has tables referencing it.'
                : hasAppQueries
                  ? 'in an app, module, or a workflow.'
                  : `by ${foreignKeyTables
                      .map((table) => table.name)
                      .join(', ')} via foreign keys. Drop or repoint their foreign keys first.`}
            </DialogDescription>
          ) : (
            <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-default">
              The table <b>{tableName}</b> and its associated data will be permanently deleted{' '}
              <b>across all environments</b>, do you want to continue?
            </DialogDescription>
          )}
        </div>
        {!loading && blocked && <MigrationDependents dependents={dependents} />}
        {!loading && blocked && hasAppQueries && hasFKs && (
          <p className="tw-m-0 tw-font-body-default tw-text-text-medium" data-cy="migration-deps-fk-tables">
            Referencing tables: {foreignKeyTables.map((table) => table.name).join(', ')}
          </p>
        )}
        {error && <InlineInfo type="danger" variant="filled" description={error} data-cy="delete-table-error" />}
      </div>
    </ActionDialog>
  );
}
