import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';

// Same 500ms the filters panel waits before applying what is typed
const APPLY_DELAY_MS = 500;

export const CHIP_CLASS =
  'tw-flex tw-h-8 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-px-2.5 tw-text-lg [font-family:inherit] focus-within:tw-border-border-accent-strong';

const Divider = () => <span className="tw-h-3.5 tw-w-px tw-bg-border-default" aria-hidden="true" />;

const ClearButton = ({ chip, onClear }) => (
  <button
    type="button"
    aria-label={`Clear ${chip.column} filter`}
    onClick={() => onClear(chip)}
    className="tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default hover:tw-bg-interactive-hover"
  >
    <X size={12} />
  </button>
);

// A text value: applied once typing pauses (or the chip loses focus)
const TextValue = ({ chip, label, onChange }) => {
  const [draft, setDraft] = useState(chip.value);
  const lastApplied = useRef(chip.value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const apply = useMemo(
    () =>
      debounce((value) => {
        lastApplied.current = value;
        onChangeRef.current(value);
      }, APPLY_DELAY_MS),
    []
  );

  // follow changes that did not come from typing here (Clear all filters, setFilters ...)
  useEffect(() => {
    if (chip.value !== lastApplied.current) {
      apply.cancel();
      lastApplied.current = chip.value;
      setDraft(chip.value);
    }
  }, [chip.value, apply]);
  useEffect(() => () => apply.cancel(), [apply]);

  const empty = draft === '';
  return (
    <input
      type="text"
      data-chip-part="value"
      data-cy="filter-chip-value"
      data-empty={empty ? 'true' : 'false'}
      aria-label={`${label} value`}
      value={draft}
      placeholder={chip.placeholder}
      onChange={(event) => {
        setDraft(event.target.value);
        apply(event.target.value);
      }}
      onBlur={() => apply.flush()}
      // the global `input[type="text"]` rule paints any outline that is not "none"; the chip border shows the focus
      style={{ width: `${Math.max(6, String(draft).length + 1)}ch`, maxWidth: '160px', outline: 'none' }}
      className="tw-min-w-0 tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-text-text-default [font-family:inherit] placeholder:tw-text-text-placeholder"
    />
  );
};

// A value picked from a list of options
const OptionValue = ({ chip, label, options, onChange, darkMode }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === chip.value);
  const shown = chip.value === '' ? chip.placeholder : (selected?.label ?? chip.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-chip-part="value"
          data-cy="filter-chip-value"
          data-empty={chip.value === '' ? 'true' : 'false'}
          aria-label={`${label} value`}
          aria-haspopup="listbox"
          className={cn(
            'tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg [font-family:inherit]',
            chip.value === '' ? 'tw-text-text-placeholder' : 'tw-text-text-default'
          )}
        >
          <span className="tw-max-w-[160px] tw-truncate">{shown}</span>
          <ChevronDown size={12} className="tw-shrink-0 tw-text-icon-default" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        // above the table and the dialogs the builder lifts to 1050
        className={cn(
          'tw-z-[1060] tw-w-max tw-min-w-[196px] tw-max-w-[280px] tw-gap-0 tw-p-2',
          darkMode && 'dark-theme'
        )}
      >
        <div role="listbox" aria-label={label} className="tw-flex tw-max-h-60 tw-flex-col tw-overflow-y-auto">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === chip.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="tw-flex tw-h-8 tw-w-full tw-shrink-0 tw-items-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-lg tw-text-text-default [font-family:inherit] hover:tw-bg-interactive-hover aria-selected:tw-font-medium"
            >
              <span className="tw-truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * One quick filter, editable in place: column and operator, then a value box (typed, or picked from `options`).
 * `fill` stretches it to its container (the "+N more" menu). The cross clears the value and keeps the chip. A chip whose operator takes no value (is empty ...) is switched
 * on and off by clicking it.
 */
export const FilterChip = memo(({ chip, dataCy, options, onValueChange, onClear, darkMode, fill = false }) => {
  const label = `${chip.column} ${chip.operator}`;
  const hasValue = chip.applied && (!chip.needsValue || chip.value !== '');

  return (
    <div data-cy={dataCy} className={cn(CHIP_CLASS, fill && 'tw-w-full')}>
      {chip.needsValue ? (
        <>
          <span data-chip-part="column" className="tw-font-medium tw-text-text-default">
            {chip.column}
          </span>
          <span data-chip-part="operator" className="tw-text-text-placeholder">
            {chip.operator}
          </span>
          <Divider />
          {options ? (
            <OptionValue
              chip={chip}
              label={label}
              options={options}
              onChange={(value) => onValueChange(chip, value)}
              darkMode={darkMode}
            />
          ) : (
            <TextValue chip={chip} label={label} onChange={(value) => onValueChange(chip, value)} />
          )}
        </>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-pressed={chip.applied}
          onClick={() => onValueChange(chip, !chip.applied)}
          className="tw-flex tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg [font-family:inherit]"
        >
          <span data-chip-part="column" className="tw-font-medium tw-text-text-default">
            {chip.column}
          </span>
          <span data-chip-part="operator" className="tw-text-text-placeholder">
            {chip.operator}
          </span>
        </button>
      )}
      {hasValue && <ClearButton chip={chip} onClear={onClear} />}
    </div>
  );
});
