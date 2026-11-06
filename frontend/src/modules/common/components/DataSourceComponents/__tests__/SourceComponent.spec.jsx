import React from 'react';
import { render, screen } from '@testing-library/react';
import { SourceComponent } from '../index';

jest.mock('@/_components/DynamicForm', () => () => <div data-testid="dynamic-form" />);
jest.mock('@/_components/DynamicFormV2', () => () => <div data-testid="dynamic-form-v2" />);

describe('SourceComponent', () => {
  it('shows a message instead of crashing when the data source has no schema', () => {
    render(<SourceComponent dataSourceSchema={undefined} />);

    expect(screen.getByText('No configuration available for this data source.')).toBeInTheDocument();
  });

  it('renders DynamicFormV2 for a tj:version schema', () => {
    render(<SourceComponent dataSourceSchema={{ 'tj:version': '1.0.0' }} />);

    expect(screen.getByTestId('dynamic-form-v2')).toBeInTheDocument();
  });

  it('renders DynamicForm for a legacy schema', () => {
    render(<SourceComponent dataSourceSchema={{ source: { kind: 'legacy' } }} />);

    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
  });
});
