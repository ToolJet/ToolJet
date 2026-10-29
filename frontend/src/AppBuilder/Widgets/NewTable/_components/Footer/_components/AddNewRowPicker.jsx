import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket';
import { getRowChips } from '../../../_utils/addNewRowChips';

const CHIP_CLASS = 'tw-min-w-8 tw-px-2 tw-text-base [font-family:inherit]';
const SELECTED_CLASS = 'tw-bg-button-outline-pressed';
const INVALID_CLASS =
  'tw-border-border-danger-strong tw-bg-background-error-weak tw-text-text-danger hover:tw-bg-background-error-weak';
// The menu renders in a portal, so it needs a layer above the table popover and above a dialog (see AddNewRowFields).
const MENU_LAYER_CLASS = 'tw-z-[1060]';

const rowName = (index, invalid) => `Row ${index + 1}${invalid ? ', has errors' : ''}`;

const RowChip = ({ index, selected, invalid, disabled, onSelect }) => (
  <Button
    variant="outline"
    aria-label={rowName(index, invalid)}
    aria-current={selected ? 'true' : undefined}
    data-invalid={invalid ? 'true' : undefined}
    data-cy={`add-new-row-chip-${index}`}
    disabled={disabled}
    className={cn(CHIP_CLASS, selected && SELECTED_CLASS, invalid && INVALID_CLASS)}
    onClick={() => onSelect(index)}
  >
    {index + 1}
  </Button>
);

// "…" stands for the rows that have no chip. It turns red when one of them has errors, and lists them in a menu.
const MoreRows = ({ hidden, invalidRows, disabled, onSelect }) => {
  const [open, setOpen] = useState(false);
  const hasInvalid = hidden.some((index) => invalidRows.has(index));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={hasInvalid ? 'More rows, has errors' : 'More rows'}
          aria-haspopup="menu"
          aria-expanded={open}
          data-invalid={hasInvalid ? 'true' : undefined}
          data-cy="add-new-row-more-chip"
          disabled={disabled}
          className={cn(CHIP_CLASS, 'tw-bg-button-outline-hover', hasInvalid && INVALID_CLASS)}
        >
          …
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        role="menu"
        className={cn(MENU_LAYER_CLASS, 'tw-max-h-[240px] tw-w-auto tw-min-w-[72px] tw-overflow-y-auto tw-p-1')}
      >
        {hidden.map((index) => (
          <button
            key={index}
            type="button"
            role="menuitem"
            aria-label={rowName(index, invalidRows.has(index))}
            data-invalid={invalidRows.has(index) ? 'true' : undefined}
            className={cn(
              'tw-block tw-w-full tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-left tw-text-lg tw-text-text-default [font-family:inherit] hover:tw-bg-button-outline-hover',
              invalidRows.has(index) && 'tw-text-text-danger'
            )}
            onClick={() => {
              setOpen(false);
              onSelect(index);
            }}
          >
            {index + 1}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

// Row chips with "+" and, under them, "ROW x OF N" and Remove row. `invalidRows` holds the indexes of the rows
// that failed the last Add rows click.
export const AddNewRowPicker = ({ count, active, invalidRows, disabled, onSelect, onAdd, onRemove }) => (
  <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-px-4 tw-pt-4">
    <div role="group" aria-label="Rows" className="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
      {getRowChips(count, active).map((chip) =>
        chip.type === 'more' ? (
          <MoreRows key="more" hidden={chip.hidden} invalidRows={invalidRows} disabled={disabled} onSelect={onSelect} />
        ) : (
          <RowChip
            key={chip.index}
            index={chip.index}
            selected={chip.index === active}
            invalid={invalidRows.has(chip.index)}
            disabled={disabled}
            onSelect={onSelect}
          />
        )
      )}
      <Button
        variant="primary"
        aria-label="Add another row"
        data-cy="add-another-row-button"
        disabled={disabled}
        className="tw-w-8 tw-px-0"
        onClick={onAdd}
      >
        <Plus size={16} aria-hidden="true" />
      </Button>
    </div>
    <div className="tw-flex tw-h-5 tw-items-center tw-justify-between">
      <span className="tw-text-sm tw-font-medium tw-uppercase tw-text-text-placeholder">
        Row {active + 1} of {count}
      </span>
      {count > 1 && (
        <Button
          variant="ghost"
          size="small"
          data-cy="remove-row-button"
          disabled={disabled}
          className="tw-gap-1 tw-px-1 tw-text-sm [font-family:inherit]"
          onClick={onRemove}
        >
          <Trash2 size={12} aria-hidden="true" />
          Remove row
        </Button>
      )}
    </div>
  </div>
);
