import React from 'react';
import { render } from '@testing-library/react';

// Capture the props react-select-search receives so we can assert the placeholder
// without depending on its internal DOM.
const mockSelectSearchProps = [];
jest.mock('react-select-search', () => ({
  __esModule: true,
  default: (props) => {
    mockSelectSearchProps.push(props);
    return null;
  },
}));

import { CustomDropdownColumn } from '../_components/DataTypes/CustomDropdown';

describe('CustomDropdownColumn (table select/multiselect) placeholder', () => {
  beforeEach(() => {
    mockSelectSearchProps.length = 0;
  });

  const options = [{ name: 'Alpha', value: 'a' }];

  it('shows no "Select..." placeholder when the cell is empty (defaults to blank)', () => {
    render(
      <CustomDropdownColumn options={options} value={undefined} multiple={false} isEditable onChange={() => {}} />
    );
    expect(mockSelectSearchProps).toHaveLength(1);
    expect(mockSelectSearchProps[0].placeholder).toBe('');
  });

  it('forwards a configured placeholder when one is provided', () => {
    render(
      <CustomDropdownColumn
        options={options}
        value={undefined}
        multiple={false}
        isEditable
        onChange={() => {}}
        placeholder="Choose a value"
      />
    );
    expect(mockSelectSearchProps[0].placeholder).toBe('Choose a value');
  });
});
