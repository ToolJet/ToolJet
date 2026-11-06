import React, { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { getVisibleChipIds } from '../../../_utils/chipOverflow';
import { CHIP_CLASS, FilterChip } from './FilterChip';

const GAP = 8;

const sameSet = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

const MORE_CLASS = cn(CHIP_CLASS, 'tw-cursor-pointer hover:tw-bg-interactive-hover');

const noop = () => {};

// The chip itself, drawn out of sight, so its width is the width it will have in the row
const MeasuredChip = ({ chip, options, column, tableId, darkMode }) => (
  <div data-chip-measure={chip.id} className="tw-flex-none">
    <FilterChip
      chip={chip}
      options={options}
      column={column}
      tableId={tableId}
      onValueChange={noop}
      onClear={noop}
      darkMode={darkMode}
    />
  </div>
);

// `compact` is just the count, for a header too narrow for the word
const MoreLabel = ({ count, compact = false }) => (
  <>
    <span data-chip-part="count" className="tw-font-medium tw-text-text-default">
      +{count}
    </span>
    {!compact && (
      <>
        {' '}
        <span data-chip-part="more-label" className="tw-text-text-placeholder">
          more
        </span>
      </>
    )}
  </>
);

const SectionTitle = ({ dataCy, children }) => (
  <div data-cy={dataCy} className="tw-text-base tw-leading-4 tw-text-text-placeholder">
    {children}
  </div>
);

/**
 * The builder's quick filters beside the filter button. Chips that do not fit collapse into a "+N more" chip
 * whose menu lists the rest, each editable in place. Chips with a value get room before empty ones.
 */
export const FilterChips = memo(
  ({ chips, componentName, tableId, getOptions, getColumn, onValueChange, onClear, darkMode }) => {
    const rowRef = useRef(null);
    const measureRef = useRef(null);
    const areaRef = useRef(null);
    const [visibleIds, setVisibleIds] = useState(null);
    // the header is too narrow for "+N more": the more chip is just "+N"
    const [compact, setCompact] = useState(false);
    // narrower even than that: nothing is shown, rather than a chip cut off by the search box
    const [noRoom, setNoRoom] = useState(false);
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
      const available = rowRef.current.getBoundingClientRect().width;
      const isCompact = available > 0 && available < (widths.more ?? 0) + GAP;
      setCompact(isCompact);
      setNoRoom(available > 0 && available < (widths['more-compact'] ?? 0));
      const next = getVisibleChipIds({
        chips,
        widths,
        available,
        gap: GAP,
        moreWidth: (isCompact ? widths['more-compact'] : widths.more) ?? 0,
      });
      setVisibleIds((previous) => (previous && sameSet(previous, next) ? previous : next));
    }, [chips]);

    // The widths above are estimates from hidden copies; what the chips really take is checked here. A chip that
    // sticks out of its area is not left cut off: the last one without a value (else the last one) moves into the
    // "+N more" chip. A chip the user is typing in stays.
    const fit = useCallback(() => {
      const area = areaRef.current;
      if (!area || menuOpenRef.current || area.scrollWidth <= area.clientWidth + 1) return;
      const inUse = area.contains(document.activeElement)
        ? document.activeElement.closest('[data-chip-id]')?.dataset.chipId
        : null;
      const candidates = [...area.querySelectorAll('[data-chip-id]')]
        .map((element) => chips.find(({ id }) => id === element.dataset.chipId))
        .filter((chip) => chip && chip.id !== inUse);
      const leaving = [...candidates].reverse().find(({ applied }) => !applied) ?? candidates[candidates.length - 1];
      if (!leaving) return;
      setVisibleIds((previous) => {
        const next = new Set(previous ?? chips.map(({ id }) => id));
        next.delete(leaving.id);
        return next;
      });
    }, [chips]);

    useLayoutEffect(() => {
      measure();
    }, [measure, menuOpen]);

    // after every draw, until nothing sticks out
    useLayoutEffect(() => {
      fit();
    });

    useLayoutEffect(() => {
      if (!rowRef.current || typeof ResizeObserver === 'undefined') return undefined;
      const observer = new ResizeObserver(() => {
        measure();
        fit();
      });
      observer.observe(rowRef.current);
      // the copies change width when the font arrives or a value changes: measured again then, not only on a resize
      if (measureRef.current) observer.observe(measureRef.current);
      return () => observer.disconnect();
    }, [measure, fit]);

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
          data-chip-measure-root
          aria-hidden="true"
          className="tw-pointer-events-none tw-invisible tw-absolute tw-left-0 tw-top-0 tw-flex tw-h-0 tw-w-max tw-gap-2 tw-overflow-hidden"
        >
          {chips.map((chip) => (
            <MeasuredChip
              key={chip.id}
              chip={chip}
              options={getOptions(chip)}
              column={getColumn?.(chip)}
              tableId={tableId}
              darkMode={darkMode}
            />
          ))}
          <div data-chip-measure="more" className={MORE_CLASS}>
            <MoreLabel count={chips.length} />
          </div>
          <div data-chip-measure="more-compact" className={MORE_CLASS}>
            <MoreLabel count={chips.length} compact />
          </div>
        </div>

        {/* the chips that were given room clip here if one is wider than measured; the more chip is outside it, so it stays in view */}
        <div ref={areaRef} data-chip-area className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-overflow-hidden">
          {chips.map(
            (chip, index) =>
              shown(chip.id) && (
                <FilterChip
                  key={chip.id}
                  chip={chip}
                  dataCy={`${componentName}-filter-chip-${index}`}
                  options={getOptions(chip)}
                  column={getColumn?.(chip)}
                  tableId={tableId}
                  onValueChange={onValueChange}
                  onClear={onClear}
                  darkMode={darkMode}
                />
              )
          )}
        </div>

        {hidden.length > 0 && !noRoom && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button type="button" data-cy={`${componentName}-filter-more-chip`} className={MORE_CLASS}>
                <MoreLabel count={hidden.length} compact={compact} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className={cn(
                'tw-z-[1060] tw-flex tw-w-max tw-max-w-[min(340px,calc(100vw-32px))] tw-flex-col tw-gap-3 tw-p-2',
                darkMode && 'dark-theme'
              )}
            >
              {[
                { key: 'quick', title: 'Quick filters', list: hidden.filter(({ user }) => !user) },
                { key: 'yours', title: 'Your filters', list: hidden.filter(({ user }) => user) },
              ]
                .filter(({ list }) => list.length > 0)
                .map(({ key, title, list }) => (
                  <div
                    key={key}
                    data-cy={`${componentName}-filter-menu-section-${key}`}
                    className="tw-flex tw-flex-col tw-gap-2"
                  >
                    <SectionTitle dataCy={`${componentName}-filter-menu-title-${key}`}>{title}</SectionTitle>
                    {list.map((chip) => (
                      <FilterChip
                        key={chip.id}
                        chip={chip}
                        dataCy={`${componentName}-filter-menu-chip-${chips.indexOf(chip)}`}
                        fill
                        options={getOptions(chip)}
                        column={getColumn?.(chip)}
                        tableId={tableId}
                        onValueChange={onValueChange}
                        onClear={onClear}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }
);
