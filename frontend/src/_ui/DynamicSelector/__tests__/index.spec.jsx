import React from 'react';
import { render, screen } from '@testing-library/react';

const mockQueryId = '401a9207-2d42-4bd9-ba11-2a9e6ac71079';
const mockStoredExpression = `{{queries.${mockQueryId}.data.sheets[0].properties.title}}`;
const mockStoreState = {
  user: null,
  getAllExposedValues: () => ({}),
  getComponentNameIdMapping: () => ({}),
  getQueryNameIdMapping: () => ({ service_rw: mockQueryId }),
  replaceIdsWithName: (value) => value.replace(mockQueryId, 'service_rw'),
};

jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: (selector) => selector(mockStoreState),
}));

jest.mock('@/_components/AppButton', () => ({
  ButtonSolid: () => null,
}));

jest.mock('@/_ui/Select', () => ({
  __esModule: true,
  default: ({ value }) => (
    <div data-testid="selected-option" data-value={value?.value}>
      {value?.label}
    </div>
  ),
}));

jest.mock('@/AppBuilder/CodeBuilder/Elements/FxButton', () => () => null);
jest.mock('@/AppBuilder/CodeEditor', () => () => null);
jest.mock('@/_ui/Spinner', () => () => null);

const DynamicSelector = require('../index').default;

describe('DynamicSelector', () => {
  it('shows query names in the fallback label without changing the stored expression', () => {
    render(
      <DynamicSelector
        options={{ sheet: mockStoredExpression }}
        optionsChanged={jest.fn()}
        optionchanged={jest.fn()}
        propertyKey="sheet"
        selectedDataSource={null}
        value={mockStoredExpression}
      />
    );

    const selectedOption = screen.getByTestId('selected-option');
    expect(selectedOption).toHaveTextContent('{{queries.service_rw.data.sheets[0].properties.title}}');
    expect(selectedOption).toHaveAttribute('data-value', mockStoredExpression);
  });
});
