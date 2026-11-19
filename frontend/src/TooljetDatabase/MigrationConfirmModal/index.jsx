import React, { useRef } from 'react';
import cx from 'classnames';
import { ArrowRight, Minus, Plus, SquarePen, X } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/Rocket/Dialog/Dialog';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Input } from '@/components/ui/Rocket/Input/Input';
import SqlEditor from '../_components/SqlEditor';
import MigrationDependents from '../_components/MigrationDependents';
import './styles.scss';

// A change row's kind - drives both the icon and the chip color. Exported so call sites building a `changes` entry
// use this instead of hand-typing 'add'/'remove'/'edit'.
export const CHANGE_TYPE = { ADD: 'add', REMOVE: 'remove', EDIT: 'edit' };

const CHANGE_ROW_ICON = { [CHANGE_TYPE.ADD]: Plus, [CHANGE_TYPE.REMOVE]: Minus, [CHANGE_TYPE.EDIT]: SquarePen };
const CHANGE_CHIP = {
  [CHANGE_TYPE.ADD]: 'tw-bg-background-success-weak tw-text-icon-success',
  [CHANGE_TYPE.REMOVE]: 'tw-bg-button-danger-secondary tw-text-icon-danger',
  [CHANGE_TYPE.EDIT]: 'tw-bg-background-accent-weak tw-text-icon-accent',
};
const STRUCK = 'tw-text-text-placeholder tw-line-through';

// `name`/`oldName` carry the struck-vs-plain split (drop: name struck, no oldName; rename: oldName
// struck + name plain; add/non-renaming edit: name plain). `detail` is the muted second half - a
// plain string, or a node for the type-change arrow. `type` is a CHANGE_TYPE value.
function ChangeRow({ type, name, oldName, detail }) {
  const Icon = CHANGE_ROW_ICON[type] ?? SquarePen;
  return (
    <div className="tw-flex tw-items-center tw-gap-1.5">
      <span
        className={cx(
          'tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-sm',
          CHANGE_CHIP[type] ?? CHANGE_CHIP[CHANGE_TYPE.EDIT]
        )}
      >
        <Icon aria-hidden className="tw-size-3" />
      </span>
      {/* One line of text, as in the design: the name, then its detail after a space. */}
      <span className="tw-min-w-0 tw-truncate tw-font-body-default tw-text-text-default">
        {oldName && (
          <>
            <span className={STRUCK}>{oldName}</span>{' '}
          </>
        )}
        <span className={cx({ [STRUCK]: type === CHANGE_TYPE.REMOVE })}>{name}</span>
        {detail && (
          <>
            {' '}
            {/* A dropped column's detail is the news, so it keeps the default colour; the rest is context. */}
            <span
              className={cx('tw-inline-flex tw-items-center tw-gap-1 tw-align-bottom [&_svg]:tw-size-3', {
                'tw-text-text-placeholder': type !== CHANGE_TYPE.REMOVE,
              })}
            >
              {detail}
            </span>
          </>
        )}
      </span>
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

const sqlPlaceholder = (sqlRequired) =>
  sqlRequired ? '-- Required: write the SQL that makes this change' : '-- Write the SQL for schema and data migration';

/**
 * Dialog on every schema save (all 9 actions) - same header/title/changes/deps chrome throughout.
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
  sqlRequired,
  sql,
  onSqlChange,
  tableNames = [],
  depsLoading,
  dependents,
  error,
  submitting,
  canConfirm,
  onConfirm,
  onCancel,
}) {
  const titleRef = useRef(null);
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className={cx('tw-max-h-[calc(100vh-2rem)]', { 'dark-theme theme-dark': darkMode })}
        // Radix would focus the first control, the close button; the title is where the user starts.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
        data-cy="migration-confirm-modal"
      >
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5">
            <DialogTitle className="tw-font-title-heavy-large">
              {modalTitle || 'Schema changes require migration'}
            </DialogTitle>
            <DialogDescription className="tw-m-0 tw-font-body-default tw-text-text-medium">
              Run migration on development environment
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            iconOnly
            size="default"
            aria-label="Close"
            onClick={onCancel}
            data-cy="migration-confirm-modal-close"
          >
            <X />
          </Button>
        </div>

        <DialogBody scrollable noPadding className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
          <div className="tw-flex tw-flex-col tw-gap-0.5">
            <label
              htmlFor="migration-confirm-title"
              className="tw-m-0 tw-pl-0.5 tw-font-title-default tw-text-text-default"
            >
              Title
            </label>
            <Input
              ref={titleRef}
              id="migration-confirm-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={titlePlaceholder}
              maxLength={120}
              data-cy="migration-confirm-title-input"
            />
          </div>

          {showSqlEditor && (
            <div className="tw-flex tw-flex-col tw-gap-0.5" data-testid="migration-confirm-sql-editor-field">
              <span
                className="tw-pl-0.5 tw-font-title-default tw-text-text-default"
                data-cy="migration-confirm-sql-label"
              >
                {sqlRequired ? 'SQL' : 'SQL (optional)'}
              </span>
              <SqlEditor
                compact
                value={sql}
                onChange={onSqlChange}
                minHeight="50px"
                maxHeight="120px"
                placeholder={sqlPlaceholder(sqlRequired)}
                dataCy="migration-confirm-sql-editor"
                allowTableRef
                tableNames={tableNames}
              />
              {/* Table references must go through {{self}}/{{table.<name>}}, never a logical name directly - the
                  physical table name is a uuid, which Postgres only accepts as a bare identifier when quoted
                  (unquoted, the hyphens read as subtraction). Helper text, not placeholder: it stays while typing. */}
              <p
                className="tw-m-0 tw-pl-0.5 tw-font-body-small tw-text-text-placeholder"
                data-testid="migration-confirm-sql-hint"
              >
                Reference tables as <code className="tw-font-code-regular">{'"{{self}}"'}</code> (this table) or{' '}
                <code className="tw-font-code-regular">{'"{{table.<name>}}"'}</code> (another table), not by logical
                name.
              </p>
            </div>
          )}

          {banner}

          {changes.length > 0 && (
            <div className="tw-flex tw-flex-col tw-gap-0.5">
              <p className="tw-m-0 tw-font-title-default tw-text-text-default">Changes overview ({changes.length})</p>
              <div
                className="tw-flex tw-flex-col tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-px-3 tw-py-2"
                data-testid="migration-changes-list"
                data-cy="migration-changes-list"
              >
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

          <MigrationDependents loading={depsLoading} dependents={dependents} />

          {error && (
            <div className="tw-text-text-danger" data-cy="migration-confirm-error">
              {error}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="tw-border-border-weak tw-px-4 tw-py-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting} data-cy="migration-confirm-cancel">
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={submitting} disabled={!canConfirm} data-cy="migration-confirm-run">
            Run in development
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
