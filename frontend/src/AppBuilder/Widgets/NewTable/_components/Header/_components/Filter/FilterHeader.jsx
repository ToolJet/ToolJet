import React, { memo } from 'react';

export const FilterHeader = memo(({ setShowFilter }) => {
  return (
    <div className="card-header row">
      <div className="col">
        <h4 data-cy={`header-filters`} className="font-weight-normal">
          Filters
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
