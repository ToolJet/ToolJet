import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import SqlEditor from '../_components/SqlEditor';
import DependentsWarning from '../_components/DependentsWarning';
import './styles.scss';

const CHANGE_ROW_CLASS = { '+': 'add', '-': 'remove', '✎': 'edit' };

function ChangeRow({ type, label }) {
  return (
    <div className={cx('migration-change-row', CHANGE_ROW_CLASS[type] ?? 'edit')}>
      <span className="migration-change-icon">{type}</span>
      <span className="migration-change-label">{label}</span>
    </div>
  );
}

/**
 * Modal on every schema save (all 9 actions). The three delete actions get the reduced form -
 * `showSqlEditor: false` hides the SQL step, everything else (Title, changes overview, deps
 * warning) stays the same. `useMigrationModal` owns all of this component's props as state.
 */
export default function MigrationConfirmModal({
  show,
  darkMode,
  modalTitle,
  titlePlaceholder,
  title,
  onTitleChange,
  changes = [],
  banner,
  showSqlEditor,
  sql,
  onSqlChange,
  tableNames = [],
  depsLoading,
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
      data-cy="migration-confirm-modal"
    >
      <Modal.Header closeButton={false}>
        <Modal.Title>
          {modalTitle || (showSqlEditor ? 'Schema changes require migration' : 'Confirm migration')}
        </Modal.Title>
        <span className="cursor-pointer" onClick={onCancel} data-cy="migration-confirm-modal-close">
          <SolidIcon name="remove" width="16" fill="#889096" />
        </span>
      </Modal.Header>
      <Modal.Body className="migration-confirm-modal-body">
        <div className="mb-3">
          <div className="form-label">Title</div>
          <input
            type="text"
            className="form-control"
            placeholder={titlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={120}
            autoFocus
            data-cy="migration-confirm-title-input"
          />
        </div>

        {banner}

        {showSqlEditor && (
          <div className="mb-3">
            <div className="form-label">Run migration on development environment</div>
            {/* Table references must go through {{self}}/{{table.<name>}}, never a logical name
                directly - the physical table name is a uuid, which Postgres only accepts as a bare
                identifier when quoted (unquoted, the hyphens read as subtraction). */}
            <div className="tw-text-muted tw-mb-1" style={{ fontSize: '12px' }}>
              Reference tables as <code>{'"{{self}}"'}</code> (this table) or <code>{'"{{table.<name>}}"'}</code>{' '}
              (another table) - not by logical name.
            </div>
            <SqlEditor
              value={sql}
              onChange={onSqlChange}
              height="15vh"
              placeholder={'-- Optional: an accompanying data step, e.g. UPDATE "{{self}}" SET column = value;'}
              dataCy="migration-confirm-sql-editor"
              allowTableRef
              tableNames={tableNames}
            />
          </div>
        )}

        {changes.length > 0 && (
          <div className="mb-3">
            <div className="form-label">Changes overview ({changes.length})</div>
            <div className="migration-changes-list" data-cy="migration-changes-list">
              {changes.map((change, index) => (
                <ChangeRow key={index} type={change.type} label={change.label} />
              ))}
            </div>
          </div>
        )}

        <DependentsWarning loading={depsLoading} dependents={dependents} />

        {error && (
          <div className="text-danger mt-2" data-cy="migration-confirm-error">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <ButtonSolid variant="tertiary" onClick={onCancel} disabled={submitting} data-cy="migration-confirm-cancel">
          Cancel
        </ButtonSolid>
        <ButtonSolid variant="primary" onClick={onConfirm} isLoading={submitting} data-cy="migration-confirm-run">
          Run in development
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}
