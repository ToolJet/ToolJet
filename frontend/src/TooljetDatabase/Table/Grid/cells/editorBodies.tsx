import React from 'react';
import { CircleCheckBig, Expand, TriangleAlert, X } from 'lucide-react';
import { FieldError } from '@/components/ui/Rocket/Field/Field';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/Rocket/ToggleGroup/ToggleGroup';
import { cn } from '@/lib/utils';
import {
  convertToDateType,
  formatDate,
  getUTCOffset,
} from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { jsonDraftError, type CellMode } from './cellDraft';
import { TimestampPicker } from './TimestampPicker';

/** The dashed box the editors show instead of a field while the draft is NULL or the column default. */
export function ModeNotice({
  mode,
  columnDefault,
  noun = 'value',
}: {
  mode: CellMode;
  columnDefault?: string | null;
  /** What NULL means for the type: "No <noun> is stored (NULL)." */
  noun?: string;
}) {
  const text =
    mode === 'default' ? `The column default is used: ${columnDefault ?? ''}.` : `No ${noun} is stored (NULL).`;
  return (
    <div
      data-cy="cell-editor-mode-notice"
      className="tw-flex tw-h-[120px] tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-dashed tw-border-border-default tw-px-3 tw-text-center tw-font-body-default tw-text-text-placeholder"
    >
      {text}
    </div>
  );
}

type BooleanBodyProps = { text: string; disabled: boolean; onChange: (text: string) => void };

// False / True, as a segmented control: both are reachable by click, and a NULL cell starts on False.
export function BooleanBody({ text, disabled, onChange }: BooleanBodyProps) {
  return (
    <ToggleGroup
      type="single"
      value={text}
      disabled={disabled}
      // A pressed item pressed again reports '': keep the choice.
      onValueChange={(next: string) => next && onChange(next)}
      className="tw-w-full"
      aria-label="Boolean value"
    >
      <ToggleGroupItem value="false" className="tw-flex-1" data-cy="cell-editor-false">
        False
      </ToggleGroupItem>
      <ToggleGroupItem value="true" className="tw-flex-1" data-cy="cell-editor-true">
        True
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

type TimestampBodyProps = { text: string; timezone: string; onChange: (text: string) => void };

// The picker works on plain wall-clock dates, so the stored ISO text converts at the edge, like the drawers do.
export function TimestampBody({ text, timezone, onChange }: TimestampBodyProps) {
  return (
    <TimestampPicker
      value={text ? convertToDateType(text, timezone) : null}
      onChange={(date) => onChange(formatDate(date, timezone) ?? '')}
      // The helper writes "+ 5:30"; the design reads "UTC +5:30".
      utcOffset={`UTC ${getUTCOffset(timezone).replace(/\s/g, '')}`}
    />
  );
}

// Design: validation message (triangle-alert and the text, small, danger), as in the drawers.
function ValidationMessage({
  text,
  tone = 'error',
  'data-cy': dataCy,
}: {
  text: string;
  tone?: 'error' | 'success';
  'data-cy': string;
}) {
  const Icon = tone === 'error' ? TriangleAlert : CircleCheckBig;
  return (
    <div className="tw-flex tw-items-center tw-gap-1 tw-pl-0.5">
      <Icon
        className={cn('tw-size-3 tw-shrink-0', tone === 'error' ? 'tw-text-icon-danger' : 'tw-text-icon-success')}
        aria-hidden
      />
      <FieldError className={tone === 'success' ? 'tw-text-text-success' : undefined} data-cy={dataCy}>
        {text}
      </FieldError>
    </div>
  );
}

const jsonFieldClasses =
  'tw-w-full tw-resize-none tw-rounded-md tw-border tw-border-solid tw-bg-background-surface-layer-01 tw-py-3 tw-pl-3 tw-pr-9 tw-font-code-regular tw-text-text-default tw-outline-none disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled';

type JsonFieldProps = {
  text: string;
  columnName: string;
  error: string | null;
  disabled: boolean;
  onChange: (text: string) => void;
  className?: string;
};

// A text area that is parsed before it is saved (an object is sent as an object, never as a string).
function JsonField({ text, columnName, error, disabled, onChange, className }: JsonFieldProps) {
  return (
    <textarea
      aria-label={columnName}
      aria-invalid={error ? true : undefined}
      value={text}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        jsonFieldClasses,
        error ? 'tw-border-border-danger-strong' : 'tw-border-border-default focus:tw-border-border-accent-strong',
        className
      )}
      data-cy="cell-editor-json"
    />
  );
}

type JsonBodyProps = {
  text: string;
  columnName: string;
  disabled: boolean;
  onExpand: () => void;
  onChange: (text: string) => void;
};

// The popover's body: the field, the expand button and the parse error under it.
export function JsonBody({ text, columnName, disabled, onExpand, onChange }: JsonBodyProps) {
  const error = disabled ? null : jsonDraftError(text);
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-3">
      <div className="tw-relative">
        <JsonField
          text={text}
          columnName={columnName}
          error={error}
          disabled={disabled}
          onChange={onChange}
          className="tw-h-[196px]"
        />
        <Button
          variant="ghost"
          size="small"
          className="tw-absolute tw-right-1.5 tw-top-1.5"
          aria-label="Expand editor"
          onClick={onExpand}
        >
          <Expand size={14} />
        </Button>
      </div>
      {error && <ValidationMessage text={error} data-cy="cell-editor-json-error" />}
    </div>
  );
}

type JsonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  columnName: string;
  disabled: boolean;
  onChange: (text: string) => void;
  /** The same footer as the popover's: Null, Default, Cancel, Save. */
  footer: React.ReactNode;
};

// Design: JSON editor modal, 752 x 592: header, divider, field and message, divider, footer. The cell editor hides its
// popover while this is open, so the two never stack.
export function JsonDialog({ open, onOpenChange, text, columnName, disabled, onChange, footer }: JsonDialogProps) {
  const error = disabled ? null : jsonDraftError(text);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="tw-h-[592px] tw-w-[752px] tw-max-w-[752px] tw-overflow-hidden">
        <div className="tw-flex tw-h-14 tw-shrink-0 tw-items-center tw-gap-2 tw-px-4 tw-py-2">
          <DialogTitle className="tw-m-0 tw-font-title-large tw-text-text-default">{columnName}</DialogTitle>
          <span className="tw-font-body-small tw-text-text-placeholder">jsonb</span>
          <span className="tw-flex-1" />
          <DialogClose asChild>
            <Button variant="ghost" iconOnly size="small" aria-label="Close">
              <X className="tw-size-3.5" />
            </Button>
          </DialogClose>
        </div>
        <Separator />
        <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-2 tw-p-4">
          <JsonField
            text={text}
            columnName={columnName}
            error={error}
            disabled={disabled}
            onChange={onChange}
            className={cn(
              'tw-min-h-0 tw-flex-1 !tw-p-3 tw-border-2',
              !error && '!tw-border-[var(--interactive-focus-outline)]'
            )}
          />
          {error ? (
            <ValidationMessage text={error} data-cy="cell-editor-json-status" />
          ) : (
            !disabled && <ValidationMessage tone="success" text="Valid JSON" data-cy="cell-editor-json-status" />
          )}
        </div>
        <Separator />
        {footer}
      </DialogContent>
    </Dialog>
  );
}
