import * as React from 'react';
import PropTypes from 'prop-types';

function ResourceGridInternal({ items = [], renderItem, gridColumns = 4 }) {
  const columnClass =
    {
      1: 'sm:tw-grid-cols-1',
      2: 'sm:tw-grid-cols-2',
      3: 'sm:tw-grid-cols-2 lg:tw-grid-cols-3',
      4: 'sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4',
    }[gridColumns] || 'sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4';

  return (
    <div className={`tw-grid tw-grid-cols-1 ${columnClass} tw-gap-6 tw-mt-6`}>
      {items.map((item, index) => (
        <React.Fragment key={item.id || index}>{renderItem(item, index)}</React.Fragment>
      ))}
    </div>
  );
}

ResourceGridInternal.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  gridColumns: PropTypes.oneOf([1, 2, 3, 4]),
};

export const ResourceGrid = React.memo(ResourceGridInternal);
