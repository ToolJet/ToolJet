import React from 'react';
import { render, screen } from '@testing-library/react';
import { Openapi } from '../Openapi';

const invalidSpecMessage = 'Valid OpenAPI Spec is not available!.';

function renderEditor(spec, options = {}) {
  return render(
    <Openapi selectedDataSource={{ options: { spec: { value: spec } } }} options={options} optionsChanged={jest.fn()} />
  );
}

describe('OpenAPI query editor', () => {
  test.each([undefined, null, {}, { paths: null }])('shows the invalid-spec message for %p', (spec) => {
    renderEditor(spec);
    expect(screen.getByText(invalidSpecMessage)).toBeInTheDocument();
    expect(screen.queryByText('Operation')).not.toBeInTheDocument();
  });

  test('handles an empty spec in a saved query with an operation', () => {
    renderEditor({}, { path: '/items', operation: 'get' });
    expect(screen.getByText(invalidSpecMessage)).toBeInTheDocument();
  });

  test('renders operations for a valid spec', () => {
    renderEditor({ paths: { '/items': { get: { summary: 'List items' } } } }, { path: '/items', operation: 'get' });
    expect(screen.getByText('Operation')).toBeInTheDocument();
    expect(screen.getByText('List items')).toBeInTheDocument();
    expect(screen.queryByText(invalidSpecMessage)).not.toBeInTheDocument();
  });
});
