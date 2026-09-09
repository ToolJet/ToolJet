import React from 'react';
import { render, screen } from '@testing-library/react';
import TableRowHeightInput from '../TableRowHeightInput';

describe('TableRowHeightInput - condensed row height minimum', () => {
  // Break this catches: comparing the raw styleDefinition.cellSize.value directly
  // against 'condensed' instead of resolving an fx-bound value first, so a
  // formula-bound 'condensed' cell size never lowers the minimum below 45.
  test('allows the condensed minimum of 39 when cellSize is fx-bound to condensed', () => {
    render(
      <TableRowHeightInput
        value={45}
        onChange={jest.fn()}
        cyLabel="max-row-height"
        styleDefinition={{ cellSize: { value: "{{'condensed'}}" } }}
      />
    );

    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '39');
  });
});
