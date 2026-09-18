import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { ArrowRight, Plus, Minus, Pencil } from 'lucide-react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import SqlEditor from '../_components/SqlEditor';
import DependentsWarning from '../_components/DependentsWarning';
import './styles.scss';

// A change row's kind - drives both the icon and the chip color (see styles.scss's
// .add/.remove/.edit). Exported so call sites building a `changes` entry use this instead of
// hand-typing 'add'/'remove'/'edit'.
export const CHANGE_TYPE = { ADD: 'add', REMOVE: 'remove', EDIT: 'edit' };

const CHANGE_ROW_ICON = { [CHANGE_TYPE.ADD]: Plus, [CHANGE_TYPE.REMOVE]: Minus, [CHANGE_TYPE.EDIT]: Pencil };

// `name`/`oldName` carry the struck-vs-plain split (drop: name struck, no oldName; rename: oldName
// struck + name plain; add/non-renaming edit: name plain). `detail` is the muted second half - a
// plain string, or a node for the type-change arrow. `type` is a CHANGE_TYPE value.
function ChangeRow({ type, name, oldName, detail }) {
  const Icon = CHANGE_ROW_ICON[type] ?? Pencil;
  return (
    <div className={cx('migration-change-row', type)}>
      <span className="migration-change-icon-chip">
        <Icon size={12} />
      </span>
      {oldName && <span className="migration-change-name-struck">{oldName}</span>}
      <span className={cx({ 'migration-change-name-struck': type === CHANGE_TYPE.REMOVE })}>{name}</span>
      {detail && <span className="migration-change-detail">{detail}</span>}
    </div>
  );
}

// Shorthand for the one detail shape that isn't plain text - `int -> varchar`, with a real arrow
// icon rather than a text arrow. Exported so call sites building an edit_column type-change row
// don't each re-import ArrowRight.
export function typeChangeDetail(fromType, toType) {
  return (
    <>
      {fromType} <ArrowRight size={12} /> {toType}
    </>
  );
}

/**
 * Modal on every schema save (all 9 actions) - same header/title/changes/deps chrome throughout.
 * The three delete actions differ only in `showSqlEditor: false` (no SQL step makes sense for
 * them - see the design doc). `useMigrationModal` owns all of this component's props as state.
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
  sqlOpen,
  onOpenSql,
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
      <Modal.Header closeButton={false} className="migration-confirm-modal-header">
        <div>
          <Modal.Title>{modalTitle || 'Schema changes require migration'}</Modal.Title>
          <div className="migration-confirm-modal-subtitle tw-text-muted-foreground">
            Run migration on development environment
          </div>
        </div>
        <span className="cursor-pointer" onClick={onCancel} data-cy="migration-confirm-modal-close">
          <SolidIcon name="remove" width="16" fill="#889096" />
        </span>
      </Modal.Header>
      <Modal.Body className="migration-confirm-modal-body">
        <div className="mb-3">
          <div className="form-label">Title</div>
          <textarea
            className="form-control migration-confirm-title-input"
            placeholder={titlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={120}
            autoFocus
            rows={1}
            data-cy="migration-confirm-title-input"
          />
        </div>

        {banner}

        {showSqlEditor && (
          <div className="mb-3">
            <div className="form-label">
              SQL <span className="tw-text-muted-foreground">(Optional)</span>
            </div>
            {sqlOpen ? (
              <>
                {/* Table references must go through {{self}}/{{table.<name>}}, never a logical name
                    directly - the physical table name is a uuid, which Postgres only accepts as a bare
                    identifier when quoted (unquoted, the hyphens read as subtraction). */}
                <div className="tw-text-muted-foreground tw-mb-1" style={{ fontSize: '12px' }}>
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
              </>
            ) : (
              <ButtonSolid
                variant="tertiary"
                size="sm"
                leftIcon="plus"
                onClick={onOpenSql}
                data-cy="migration-confirm-add-migration"
              >
                Add migration
              </ButtonSolid>
            )}
          </div>
        )}

        {changes.length > 0 && (
          <div className="mb-3">
            <div className="form-label">Changes overview ({changes.length})</div>
            <div className="migration-changes-list" data-cy="migration-changes-list">
              {changes.map((change, index) => (
                <ChangeRow
                  key={index}
                  type={change.type}
                  name={change.name}
                  oldName={change.oldName}
                  detail={change.detail}
                />
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
