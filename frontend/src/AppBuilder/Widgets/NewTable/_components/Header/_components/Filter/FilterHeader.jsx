import React, { memo } from 'react';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const FilterHeader = memo(({ id, setShowFilter }) => {
  const filterPopupHeading = useTableStore((state) => state.getTableProperties(id)?.filterPopupHeading, shallow);

  return (
    <div className="card-header row">
      <div className="col">
        <h4 data-cy={`header-filters`} className="font-weight-normal">
          {filterPopupHeading}
        </h4>
      </div>
      <div className="col-auto">
        <button
          data-cy={`button-close-filters`}
          onClick={() => {
            setShowFilter(false);
          }}
          className="btn btn-light btn-sm"
        >
          x
        </button>
      </div>
    </div>
  );
});
