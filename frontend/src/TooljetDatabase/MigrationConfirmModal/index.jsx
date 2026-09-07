import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import SqlEditor from '../_components/SqlEditor';
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

// "N resources reference this table" - a floor, never phrased as "will break" (the backend can
// only see query references, not e.g. a table id hardcoded in a RunJS query).
function DependentsWarning({ loading, dependents }) {
  const [expanded, setExpanded] = useState(false);
  if (loading) {
    return (
      <div className="migration-deps-warning" data-cy="migration-deps-loading">
        Checking dependent resources…
      </div>
    );
  }
  if (!dependents || dependents.count === 0) return null;

  return (
    <div className="migration-deps-warning" data-cy="migration-deps-warning">
      <div className="migration-deps-summary" onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>
          {dependents.count} resource{dependents.count === 1 ? '' : 's'} reference this table
        </span>
      </div>
      {expanded && (
        <ul className="migration-deps-list">
          {dependents.dependents.map((dependent) => (
            <li key={dependent.id}>
              <span className="migration-deps-app-name">{dependent.name}</span>
              <span className="migration-deps-app-type">{dependent.type}</span>
              <span className="migration-deps-queries">{dependent.queries.map((query) => query.name).join(', ')}</span>
            </li>
          ))}
          {dependents.count > dependents.dependents.length && (
            <li className="migration-deps-more">+{dependents.count - dependents.dependents.length} more</li>
          )}
        </ul>
      )}
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
            {/* Unlike the seed-data SQL box, this step never parses the SQL - the table must be
                addressed as "{{self}}", never by its logical name, or Postgres reports it
                missing. It resolves to a raw uuid (hyphens included), which Postgres only accepts
                as a bare identifier when quoted - unquoted, the hyphens read as subtraction and
                fail with "syntax error at or near '-'". */}
            <div className="tw-text-muted tw-mb-1" style={{ fontSize: '12px' }}>
              Reference this table as <code>{'"{{self}}"'}</code> (double-quoted - its physical name is a uuid), not by
              its logical name.
            </div>
            <SqlEditor
              value={sql}
              onChange={onSqlChange}
              height="15vh"
              placeholder={'-- Optional: an accompanying data step, e.g. UPDATE "{{self}}" SET column = value;'}
              dataCy="migration-confirm-sql-editor"
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
