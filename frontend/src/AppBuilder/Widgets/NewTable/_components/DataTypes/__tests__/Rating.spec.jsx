import React from 'react';
import { render } from '@testing-library/react';
import { RatingColumn } from '../Rating';
import { MAX_RATING_COUNT } from '../../../_utils/helper';

const renderRatingColumn = (maxRating) => {
  const { container } = render(
    <RatingColumn
      id="table1"
      isEditable={false}
      handleCellValueChange={jest.fn()}
      textColor={undefined}
      horizontalAlignment="left"
      cellValue={null}
      column={{ key: 'col1', maxRating }}
      row={{ index: 0, original: {} }}
    />
  );

  return container.querySelectorAll('.rating-widget-group > *').length;
};

describe('RatingColumn max rating limit', () => {
  it('caps the number of rendered icons at MAX_RATING_COUNT when maxRating is entered above the limit', () => {
    const iconCount = renderRatingColumn(MAX_RATING_COUNT + 15);

    expect(iconCount).toBe(MAX_RATING_COUNT);
  });

  it('renders the configured number of icons when maxRating is within the allowed range', () => {
    const iconCount = renderRatingColumn(7);

    expect(iconCount).toBe(7);
  });
});
