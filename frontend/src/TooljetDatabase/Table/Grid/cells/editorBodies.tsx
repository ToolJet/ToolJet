import React from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Rocket/Dialog/Dialog';
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

type JsonBodyProps = {
  text: string;
  columnName: string;
  disabled: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (text: string) => void;
  /** The footer, repeated at the bottom of the expanded dialog. */
  footer: React.ReactNode;
};

const jsonFieldClasses =
  'tw-w-full tw-resize-none tw-rounded-md tw-border tw-border-solid tw-bg-background-surface-layer-01 tw-p-2 tw-font-code-regular tw-text-text-default tw-outline-none focus:tw-border-border-accent-strong disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled';

// A text area that is parsed before it is saved (an object is sent as an object, never as a string), with the
// parse error under it and an expanded dialog for long documents.
export function JsonBody({ text, columnName, disabled, expanded, onExpandedChange, onChange, footer }: JsonBodyProps) {
  const error = disabled ? null : jsonDraftError(text);
  const field = (rows: number, className?: string) => (
    <textarea
      aria-label={columnName}
      aria-invalid={error ? true : undefined}
      value={text}
      rows={rows}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
      className={cn(jsonFieldClasses, error ? 'tw-border-border-danger-strong' : 'tw-border-border-default', className)}
      data-cy="cell-editor-json"
    />
  );
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-1">
      <div className="tw-relative">
        {field(6)}
        <Button
          variant="ghost"
          size="small"
          className="tw-absolute tw-right-1 tw-top-1"
          aria-label="Expand editor"
          onClick={() => onExpandedChange(true)}
        >
          <Maximize2 size={14} />
        </Button>
      </div>
      {error && (
        <span role="alert" className="tw-font-body-default tw-text-text-danger" data-cy="cell-editor-json-error">
          {error}
        </span>
      )}
      <Dialog open={expanded} onOpenChange={onExpandedChange}>
        <DialogContent size="large">
          <DialogHeader>
            <DialogTitle>
              {columnName} <span className="tw-text-text-placeholder">jsonb</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {field(18, 'tw-h-[50vh]')}
            <span
              className={cn('tw-font-body-default', error ? 'tw-text-text-danger' : 'tw-text-text-success')}
              data-cy="cell-editor-json-status"
            >
              {disabled ? '' : (error ?? 'Valid JSON')}
            </span>
          </DialogBody>
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
