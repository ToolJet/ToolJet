import React, { memo } from 'react';
import { Plus } from 'lucide-react';

const BUTTON_CLASS =
  'tw-flex tw-h-9 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-px-3 tw-text-lg tw-font-medium [font-family:inherit]';

export const FilterFooter = memo(({ addFilter, clearFilters }) => {
  return (
    <div className="card-footer tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3">
      <button
        type="button"
        onClick={clearFilters}
        data-cy="button-clear-filters"
        className={`${BUTTON_CLASS} tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-text-text-default hover:tw-bg-interactive-hover`}
      >
        Clear all filters
      </button>
      <button
        type="button"
        onClick={addFilter}
        data-cy="button-add-filter"
        // the app theme's primary colour, like the add new row button
        className={`${BUTTON_CLASS} tw-border-0 tw-bg-[var(--cc-primary-brand)] tw-text-text-on-solid hover:tw-brightness-90`}
      >
        <Plus size={16} />
        Add filter
      </button>
    </div>
  );
});
