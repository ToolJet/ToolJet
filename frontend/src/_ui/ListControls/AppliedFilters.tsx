import React from 'react';
import { X } from 'lucide-react';

import type { FilterMenuProps } from './FilterMenu';
import { ICON_CLASS } from './parts';

// The filters in force, shown beside the filter button so they are visible with the menu closed. Every option checked
// is the same as no filter, so nothing shows then.
export function AppliedFilters<Value extends string>({
  options,
  value,
  onChange,
}: Omit<FilterMenuProps<Value>, 'label'>) {
  const allValues = options.map((option) => option.value);
  if (value.length === allValues.length) return null;

  // An empty selection would mean "all of them", so removing the last chip clears the filter.
  const remove = (removed: Value) => {
    const next = value.filter((entry) => entry !== removed);
    onChange(next.length ? next : allValues);
  };

  return (
    // 18px + the controls' 4px gap leaves the design's 22px before whatever follows.
    <div data-testid="applied-filters" className="tw-mr-[18px] tw-flex tw-items-center tw-gap-2">
      {options
        .filter((option) => value.includes(option.value))
        .map(({ value: optionValue, label }) => (
          <span
            key={optionValue}
            className="tw-flex tw-items-center tw-gap-1 tw-rounded-default tw-bg-interactive-default tw-pl-1.5 tw-pr-[3px] tw-font-title-default tw-text-text-default"
          >
            {label}
            <button
              type="button"
              aria-label={`Remove ${label} filter`}
              onClick={() => remove(optionValue)}
              className="tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1 hover:tw-bg-interactive-hover"
            >
              <X size={12} className={ICON_CLASS} />
            </button>
          </span>
        ))}
      <button
        type="button"
        onClick={() => onChange(allValues)}
        className="tw-cursor-pointer tw-rounded-default tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-[5px] tw-font-title-default tw-text-text-accent hover:tw-bg-interactive-hover"
      >
        Clear all filters
      </button>
    </div>
  );
}
