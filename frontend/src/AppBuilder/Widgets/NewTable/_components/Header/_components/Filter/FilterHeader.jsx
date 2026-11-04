import React, { memo } from 'react';
import { X } from 'lucide-react';

export const FilterHeader = memo(({ setShowFilter }) => {
  // not a `.card-header`: the table's stylesheet takes the bottom border off those
  return (
    <div className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-default tw-px-4">
      <h4 data-cy={`filter-header`} className="tw-m-0 tw-text-xl tw-font-medium tw-text-text-default">
        Filters
      </h4>
      <button
        type="button"
        data-cy={`close-filters-button`}
        aria-label="Close filters"
        onClick={() => {
          setShowFilter(false);
        }}
        className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover"
      >
        <X size={16} />
      </button>
    </div>
  );
});
