import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextRenderer } from '../TextRenderer';

const baseProps = {
  value: 'hello',
  isEditable: true,
  onChange: () => {},
  containerWidth: 100,
  isValid: false,
  validationError: 'This field must contain a valid email address format',
  isEditing: false,
  setIsEditing: () => {},
  widgetType: 'Table',
};

describe('[Table-BUG] TextRenderer: truncated validation error tooltip', () => {
  let scrollWidthSpy;
  let clientWidthSpy;

  beforeEach(() => {
    // Simulates a narrow column where the error text overflows its box (a genuine
    // browser-geometry boundary jsdom can't produce through real layout).
    scrollWidthSpy = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
    clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(50);
  });

  afterEach(() => {
    scrollWidthSpy.mockRestore();
    clientWidthSpy.mockRestore();
  });

  it('shows the full validation error in a tooltip on hover when the error text is truncated', async () => {
    render(<TextRenderer {...baseProps} />);

    const errorEl = document.querySelector('.invalid-feedback');
    expect(errorEl).toBeInTheDocument();

    await userEvent.hover(errorEl);

    const tooltip = await screen.findByText(baseProps.validationError, { selector: '.overlay-cell-table' });
    expect(tooltip).toBeInTheDocument();
  });
});
