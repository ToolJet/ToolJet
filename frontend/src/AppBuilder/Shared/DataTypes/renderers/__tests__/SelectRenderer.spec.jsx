import React from 'react';
import { render } from '@testing-library/react';
import { SelectRenderer } from '../SelectRenderer';

const baseProps = {
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ],
  value: null,
  onChange: () => {},
  disabled: false,
  darkMode: false,
  containerWidth: 100,
  horizontalAlignment: 'left',
  isNewRow: false,
  isFocused: false,
  setIsFocused: () => {},
  widgetType: 'Table',
  isValid: true,
  validationError: '',
  menuIsOpen: undefined,
};

describe('[Table-BUG] SelectRenderer: non-editable empty cell', () => {
  it('renders nothing (no dropdown, no placeholder) for a non-editable single-select cell with no value', () => {
    const { container } = render(<SelectRenderer {...baseProps} isEditable={false} isMulti={false} value={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing (no dropdown, no placeholder) for a non-editable multiselect cell with no value', () => {
    const { container } = render(<SelectRenderer {...baseProps} isEditable={false} isMulti={true} value={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('still renders the interactive dropdown with its placeholder when the column is editable and has no value', () => {
    const { container } = render(<SelectRenderer {...baseProps} isEditable={true} isMulti={false} value={null} />);

    expect(container.querySelector('.react-select__control')).toBeInTheDocument();
  });

  it('still renders the selected value when the column is not editable but has a value', () => {
    const { container } = render(<SelectRenderer {...baseProps} isEditable={false} isMulti={false} value="a" />);

    expect(container.textContent).toContain('A');
  });
});
