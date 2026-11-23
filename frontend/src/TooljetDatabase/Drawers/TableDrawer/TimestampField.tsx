import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/Rocket/InputGroup/InputGroup';
import { Popover, PopoverContent } from '@/components/ui/Rocket/Popover/Popover';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';
import {
  convertDateToTimeZoneFormatted,
  convertToDateType,
  formatDate,
  getUTCOffset,
} from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { TimestampPicker } from '../../Table/Grid/cells/TimestampPicker';

// The drawers show a timestamp in the column's time zone and store it as a string; the picker works on plain wall-clock
// dates, so this converts at the edge, with the same helpers the grid uses.

type PanelProps = {
  value: string | null | undefined;
  timezone: string;
  onApply: (value: string | null) => void;
  onCancel: () => void;
};

// The picker and its footer. It edits a draft that Apply sends; mounted only while the popover is open, so every open
// starts again from the stored value.
function TimestampPanel({ value, timezone, onApply, onCancel }: PanelProps) {
  const [draft, setDraft] = useState<Date | null>(() => (value ? convertToDateType(value, timezone) : null));
  return (
    <>
      <TimestampPicker
        value={draft}
        onChange={setDraft}
        utcOffset={`UTC ${getUTCOffset(timezone).replace(/\s/g, '')}`}
      />
      <Separator />
      <div className="tw-flex tw-items-center tw-gap-2 tw-p-3">
        {value && (
          <Button variant="ghost" size="medium" onClick={() => onApply(null)} data-cy="timestamp-clear-button">
            Clear
          </Button>
        )}
        <span className="tw-flex-1" />
        <Button variant="outline" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          disabled={!draft}
          onClick={() => draft && onApply(formatDate(draft, timezone) ?? null)}
          data-cy="timestamp-apply-button"
        >
          Apply
        </Button>
      </div>
    </>
  );
}

type TimestampFieldProps = {
  /** The stored timestamp, or empty. */
  value: string | null | undefined;
  /** The new timestamp as the old picker wrote it, or null when cleared. */
  onChange: (value: string | null) => void;
  timezone: string;
  size?: 'default' | 'small';
  disabled?: boolean;
  'data-cy'?: string;
};

// A read-only input group showing the value, with a calendar button (or a click on the field) that opens the picker.
export function TimestampField({
  value,
  onChange,
  timezone,
  size = 'default',
  disabled = false,
  'data-cy': dataCy,
}: TimestampFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="tw-w-full">
          <InputGroup size={size}>
            <InputGroupInput
              readOnly
              disabled={disabled}
              // The same text the grid shows for the column.
              value={value ? convertDateToTimeZoneFormatted(value, timezone) : ''}
              placeholder="dd/mm/yyyy, 12:00am/pm"
              aria-label="Timestamp"
              data-cy={dataCy}
              onClick={() => !disabled && setOpen(true)}
              className="tw-cursor-pointer"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Pick date and time"
                disabled={disabled}
                onClick={() => setOpen(true)}
                data-cy="timestamp-picker-button"
              >
                <CalendarClock />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="tw-z-[1100] tw-w-[320px] tw-gap-0 tw-p-0"
        // The picker's own focus handling is enough; a press on the input must not close and reopen it.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <TimestampPanel
          value={value}
          timezone={timezone}
          onApply={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
