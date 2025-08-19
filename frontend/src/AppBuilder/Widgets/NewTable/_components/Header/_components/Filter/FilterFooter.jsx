import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const FilterFooter = memo(({ id, addFilter, clearFilters }) => {
  const addFilterBtnLabel = useTableStore((state) => state.getTableProperties(id)?.addFilterBtnLabel, shallow);
  const removeFilterBtnLabel = useTableStore((state) => state.getTableProperties(id)?.removeFilterBtnLabel, shallow);

  return (
    <div className="card-footer d-flex custom-gap-8">
      <ButtonSolid
        variant="primary"
        className="tj-text-xsm"
        onClick={addFilter}
        size="sm"
        customStyles={{ padding: '10px 20px', backgroundColor: 'var(--cc-primary-brand)' }}
        data-cy="button-add-filter"
      >
        <span>{addFilterBtnLabel}</span>
      </ButtonSolid>

      <ButtonSolid
        variant="tertiary"
        className="tj-text-xsm"
        onClick={clearFilters}
        size="sm"
        customStyles={{ padding: '10px 20px' }}
        data-cy="button-clear-filters"
      >
        <span>{removeFilterBtnLabel}</span>
      </ButtonSolid>
    </div>
  );
});
