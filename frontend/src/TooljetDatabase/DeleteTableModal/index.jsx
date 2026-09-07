import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import DependentsWarning from '../_components/DependentsWarning';

/**
 * Two states, driven entirely by props - TableListItem owns the dependents fetch and the delete
 * call. `loading` is the pre-check (getTableDependents); once it resolves, `blocked` decides which
 * body renders. Built on the same react-bootstrap Modal primitive and header/footer structure as
 * MigrationConfirmModal, so the two read as one family.
 */
export default function DeleteTableModal({
  show,
  darkMode,
  tableName,
  loading,
  blocked,
  dependents,
  error,
  submitting,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      show={show}
      onHide={onCancel}
      size="lg"
      animation={false}
      centered
      contentClassName={cx('migration-confirm-modal', { 'dark-theme': darkMode })}
      data-cy="delete-table-modal"
    >
      <Modal.Header closeButton={false}>
        <Modal.Title>{blocked ? 'Dependent queries found' : 'Delete table'}</Modal.Title>
        <span className="cursor-pointer" onClick={onCancel} data-cy="delete-table-modal-close">
          <SolidIcon name="remove" width="16" fill="#889096" />
        </span>
      </Modal.Header>
      <Modal.Body className="migration-confirm-modal-body">
        {loading ? (
          <DependentsWarning loading />
        ) : blocked ? (
          <>
            <div className="mb-3">
              Table <b>{tableName}</b> cannot be deleted because it is being used in an app, module, or a workflow.
            </div>
            <DependentsWarning dependents={dependents} showForeignKeyTables />
          </>
        ) : (
          <div>
            The table <b>{tableName}</b> and it&apos;s associated data will be permanently deleted{' '}
            <b>across all environments</b>. Are you sure you want to continue?
          </div>
        )}

        {error && (
          <div className="text-danger mt-2" data-cy="delete-table-error">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {blocked ? (
          <ButtonSolid variant="primary" onClick={onCancel} data-cy="delete-table-understand">
            I understand
          </ButtonSolid>
        ) : (
          <>
            <ButtonSolid
              variant="tertiary"
              onClick={onCancel}
              disabled={submitting}
              data-cy="delete-table-modal-cancel"
            >
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="dangerPrimary"
              onClick={onConfirm}
              isLoading={submitting}
              disabled={loading}
              leftIcon="trash"
              iconWidth="16"
              data-cy="delete-table-modal-confirm"
            >
              Delete table
            </ButtonSolid>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
