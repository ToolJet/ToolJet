import React, { useMemo } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Field, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import { InlineInfo } from '@/components/ui/Rocket/InlineInfo/InlineInfo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/Select/Select';
import { getLocalTimeZone, timeZonesWithOffsets } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import type { DraftColumn } from './types';

type ColumnOptionsPopoverProps = {
  column: DraftColumn;
  /** How many columns are primary keys. Two or more make a composite key. */
  primaryKeyCount: number;
  onTimezoneChange: (timezone: string) => void;
};

const TIMESTAMP = 'timestamp with time zone';

/** Does this column have anything to show? The popover is not rendered otherwise. */
export const hasColumnOptions = (column: DraftColumn, primaryKeyCount: number): boolean =>
  column.data_type === TIMESTAMP || (column.constraints_type.is_primary_key && primaryKeyCount >= 2);

// What the old "more" menu held besides Delete: the time zone a timestamp column is shown in, and a note that the
// primary keys together form one composite key.
export function ColumnOptionsPopover({ column, primaryKeyCount, onTimezoneChange }: ColumnOptionsPopoverProps) {
  const zones = useMemo(() => timeZonesWithOffsets() as { value: string; label: string }[], []);
  const timezone = (column.configurations?.timezone as string | undefined) || getLocalTimeZone();
  const isTimestamp = column.data_type === TIMESTAMP;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          aria-label={`Options for ${column.column_name || 'column'}`}
          data-cy="column-options-button"
        >
          <EllipsisVertical />
        </Button>
      </PopoverTrigger>
      {/* Above the drawer (z-index 1000). */}
      <PopoverContent align="end" className="tw-z-[1100] tw-w-72" data-cy="column-options">
        {isTimestamp && (
          <Field>
            <FieldLabel className="tw-font-title-default">Display time</FieldLabel>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger aria-label="Display time" data-cy="timezone-type-dropdown-section">
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent className="tw-z-[1100] tw-max-h-72">
                {zones.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        {column.constraints_type.is_primary_key && primaryKeyCount >= 2 && (
          <InlineInfo
            type="info"
            description="Unique constraint will be added to combinations of values of a composite primary key"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
