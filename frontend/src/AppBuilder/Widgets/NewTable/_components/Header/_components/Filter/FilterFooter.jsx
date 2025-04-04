import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const FilterFooter = memo(({ addFilter, clearFilters }) => {
  return (
    <div className="card-footer d-flex custom-gap-8">
      <ButtonSolid
        variant="primary"
        className="tj-text-xsm"
        onClick={addFilter}
        size="sm"
        customStyles={{ padding: '10px 20px' }}
        data-cy="button-add-filter"
      >
        <span>+ add filter</span>
      </ButtonSolid>

      <ButtonSolid
        variant="tertiary"
        className="tj-text-xsm"
        onClick={clearFilters}
        size="sm"
        customStyles={{ padding: '10px 20px' }}
        data-cy="button-clear-filters"
      >
        <span>clear filters</span>
      </ButtonSolid>
    </div>
  );
});
