import React from 'react';
import { render } from '@testing-library/react';
import Corners from '../Corners';

describe('Corners icon', () => {
  it('carries its own data-cy by default', () => {
    const { container } = render(<Corners />);

    expect(container.querySelector('svg')).toHaveAttribute('data-cy', 'corners-icon');
  });

  it('lets the caller override data-cy', () => {
    // Callers that place the icon inside another control need to target it by
    // their own selector — e.g. NumberInput's `${inputId}-prefix-icon`.
    const { container } = render(<Corners data-cy="border-radius-input-prefix-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('data-cy', 'border-radius-input-prefix-icon');
  });
});
