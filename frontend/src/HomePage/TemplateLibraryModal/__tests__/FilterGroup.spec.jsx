import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterGroup from '../FilterGroup';

const renderGroup = () =>
  render(
    <FilterGroup
      title="Category"
      searchPlaceholder="Search categories"
      options={[
        { id: 'contracts', label: 'Contracts' },
        { id: 'rentals', label: 'Rentals' },
      ]}
      selected={new Set()}
      counts={{ contracts: 2, rentals: 1 }}
      onToggle={jest.fn()}
      dataCySuffix="category"
      rowDataCy="list-item"
      noMatchText={(query) => `No categories match “${query}”`}
    />
  );

describe('FilterGroup search', () => {
  it('shows no empty message while some option matches', async () => {
    renderGroup();
    await userEvent.type(screen.getByLabelText('Search categories'), 'rent');
    expect(screen.getByText('Rentals')).toBeInTheDocument();
    expect(screen.queryByText(/No categories match/)).not.toBeInTheDocument();
  });

  it('names the search text when nothing matches, and Clear search brings the options back', async () => {
    renderGroup();
    await userEvent.type(screen.getByLabelText('Search categories'), 'legalx');

    expect(screen.getByText('No categories match “legalx”')).toBeInTheDocument();
    expect(screen.queryByText('Contracts')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByLabelText('Search categories')).toHaveValue('');
    expect(screen.getByText('Contracts')).toBeInTheDocument();
    expect(screen.queryByText(/No categories match/)).not.toBeInTheDocument();
  });
});
