import React from 'react';
import { render, screen } from '@testing-library/react';
import BaseColorSwatches from '../BaseColorSwatches';

const renderSwatches = (props) =>
  render(<BaseColorSwatches onChange={jest.fn()} cyLabel="row-background" {...props} />);

describe('BaseColorSwatches', () => {
  test('[Table-ROWBG-010] an empty value shows the field placeholder instead of a blank label', () => {
    renderSwatches({ value: '', meta: { placeholder: 'Default' } });
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  test('[Table-ROWBG-011] a set value is shown instead of the placeholder', () => {
    renderSwatches({ value: '#FDECEC', meta: { placeholder: 'Default' } });
    expect(screen.getByText('#FDECEC')).toBeInTheDocument();
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });
});
