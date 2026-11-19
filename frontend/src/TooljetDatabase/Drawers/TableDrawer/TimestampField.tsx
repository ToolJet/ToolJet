import React from 'react';
import { DateTimePicker } from '@/components/ui/Rocket/DateTimePicker';
import { convertToDateType, formatDate } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';

// The grid and the drawers have always shown a timestamp in the column's time zone and stored it as a string; the Rocket
// picker works on plain wall-clock dates, so this converts at the edge, with the same helpers the old picker used.
const MIN_DATE = new Date(1800, 0, 1);
const MAX_DATE = new Date(2200, 11, 31);

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

export function TimestampField({
  value,
  onChange,
  timezone,
  size = 'default',
  disabled = false,
  'data-cy': dataCy,
}: TimestampFieldProps) {
  return (
    <DateTimePicker
      type="date-time"
      value={value ? convertToDateType(value, timezone) : null}
      onChange={(date) => onChange(date ? formatDate(date, timezone) : null)}
      minDate={MIN_DATE}
      maxDate={MAX_DATE}
      placeholder="dd/mm/yyyy, 12:00am/pm"
      isClearable
      size={size}
      disabled={disabled}
      // The drawers sit at z-index 1000-1002.
      popoverClassName="tw-z-[1100]"
      aria-label="Timestamp"
      data-cy={dataCy}
    />
  );
}
