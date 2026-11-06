import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VirtuosoMockContext } from 'react-virtuoso';
import DataSourceSelect from '../DataSourceSelect';

const staticSources = [
  { id: 's1', kind: 'restapi', name: 'restapidefault', type: 'static' },
  { id: 's2', kind: 'library', name: 'librarydefault', type: 'static' },
];

// The workflow builder passes the server's static sources straight through. Workflows have no
// runner for `library` queries, so it must not be offered as a workflow node.
it('does not offer Query library as a workflow node', () => {
  // The list is virtualised (react-virtuoso); give it geometry so rows render in jsdom.
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 32 }}>
      <MemoryRouter>
        <DataSourceSelect workflowDataSources={[]} staticDataSources={staticSources} closePopup={jest.fn()} />
      </MemoryRouter>
    </VirtuosoMockContext.Provider>
  );

  expect(document.querySelector('[data-cy="ds-restapidefault"]')).toBeInTheDocument();
  expect(document.querySelector('[data-cy="ds-librarydefault"]')).not.toBeInTheDocument();
  expect(screen.queryByText('Query library')).not.toBeInTheDocument();
});
