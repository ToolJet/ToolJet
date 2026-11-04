import React, { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { getVisibleChipIds } from '../../../_utils/chipOverflow';
import { CHIP_CLASS, FilterChip } from './FilterChip';

const GAP = 8;

const sameSet = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

// What a chip shows, as plain text, for measuring how wide it will be
const MeasuredChip = ({ chip }) => (
  <div data-chip-measure={chip.id} className={CHIP_CLASS}>
    <span className="tw-font-medium">{chip.column}</span>
    <span>{chip.operator}</span>
    {chip.needsValue && (
      <>
        <span className="tw-w-px" />
        <span className="tw-max-w-[160px] tw-truncate">{chip.value || chip.placeholder}</span>
      </>
    )}
    {chip.applied && <span className="tw-w-5" />}
  </div>
);

/**
 * The builder's quick filters beside the filter button. Chips that do not fit collapse into a "+N more" chip
 * whose menu lists the rest, each editable in place. Chips with a value get room before empty ones.
 */
export const FilterChips = memo(({ chips, componentName, getOptions, onValueChange, onClear, darkMode }) => {
  const rowRef = useRef(null);
  const measureRef = useRef(null);
  const [visibleIds, setVisibleIds] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOpen;

  const measure = useCallback(() => {
    // while the menu is open, a chip that just got a value stays where it is; it moves when the menu closes
    if (menuOpenRef.current || !rowRef.current || !measureRef.current) return;
    const widths = {};
    measureRef.current.querySelectorAll('[data-chip-measure]').forEach((element) => {
      widths[element.dataset.chipMeasure] = element.getBoundingClientRect().width;
    });
    const next = getVisibleChipIds({
      chips,
      widths,
      available: rowRef.current.getBoundingClientRect().width,
      gap: GAP,
      moreWidth: widths.more ?? 0,
    });
    setVisibleIds((previous) => (previous && sameSet(previous, next) ? previous : next));
  }, [chips]);

  useLayoutEffect(() => {
    measure();
  }, [measure, menuOpen]);

  useLayoutEffect(() => {
    if (!rowRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [measure]);

  if (chips.length === 0) return null;

  const shown = (id) => visibleIds === null || visibleIds.has(id);
  const hidden = chips.filter(({ id }) => !shown(id));

  return (
    <div
      ref={rowRef}
      data-cy={`${componentName}-filter-chips`}
      className="tw-relative tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-overflow-hidden"
    >
      {/* hidden copies, only there to be measured */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="tw-pointer-events-none tw-invisible tw-absolute tw-left-0 tw-top-0 tw-flex tw-h-0 tw-w-max tw-gap-2 tw-overflow-hidden"
      >
        {chips.map((chip) => (
          <MeasuredChip key={chip.id} chip={chip} />
        ))}
        <div data-chip-measure="more" className={cn(CHIP_CLASS, 'tw-font-medium')}>
          +{chips.length} more
        </div>
      </div>

      {chips.map(
        (chip, index) =>
          shown(chip.id) && (
            <FilterChip
              key={chip.id}
              chip={chip}
              dataCy={`${componentName}-filter-chip-${index}`}
              options={getOptions(chip)}
              onValueChange={onValueChange}
              onClear={onClear}
              darkMode={darkMode}
            />
          )
      )}

      {hidden.length > 0 && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-cy={`${componentName}-filter-more-chip`}
              className={cn(CHIP_CLASS, 'tw-cursor-pointer hover:tw-bg-interactive-hover')}
            >
              <span data-chip-part="count" className="tw-font-medium tw-text-text-default">
                +{hidden.length}
              </span>{' '}
              <span data-chip-part="more-label" className="tw-text-text-placeholder">
                more
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className={cn(
              'tw-z-[1060] tw-flex tw-w-max tw-max-w-[340px] tw-flex-col tw-gap-2 tw-p-2',
              darkMode && 'dark-theme'
            )}
          >
            {hidden.map((chip) => (
              <FilterChip
                key={chip.id}
                chip={chip}
                dataCy={`${componentName}-filter-menu-chip-${chips.indexOf(chip)}`}
                fill
                options={getOptions(chip)}
                onValueChange={onValueChange}
                onClear={onClear}
                darkMode={darkMode}
              />
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
