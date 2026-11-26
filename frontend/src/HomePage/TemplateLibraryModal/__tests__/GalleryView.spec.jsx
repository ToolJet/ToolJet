import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryView from '../GalleryView';

const templates = [
  {
    id: 'a',
    name: 'Alpha tracker',
    description: 'Tracks alpha.',
    category: 'cat-a',
    sources: [{ id: 'x', name: 'Src X' }],
  },
  { id: 'b', name: 'Beta desk', description: 'Runs beta.', category: 'cat-b', sources: [{ id: 'y', name: 'Src Y' }] },
];
const categoryTitles = { 'cat-a': 'Cat A', 'cat-b': 'Cat B' };

const renderGallery = () =>
  render(
    <GalleryView
      templates={templates}
      loadStatus="loaded"
      onRetry={jest.fn()}
      categoryTitles={categoryTitles}
      onOpen={jest.fn()}
    />
  );

const searchTemplates = (text) => userEvent.type(screen.getByLabelText('Search templates'), text);

describe('GalleryView empty states', () => {
  it('shows the search empty state with the search text, and Clear search restores the grid', async () => {
    renderGallery();
    await searchTemplates('zzz');

    expect(screen.getByText('No templates found')).toBeInTheDocument();
    expect(screen.getByText(/matching “zzz”/)).toBeInTheDocument();
    expect(screen.queryByText('Alpha tracker')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByLabelText('Search templates')).toHaveValue('');
    expect(screen.getByText('Alpha tracker')).toBeInTheDocument();
    expect(screen.getByText('Beta desk')).toBeInTheDocument();
  });

  it('keeps the filter empty state when filters, not search, remove every template', async () => {
    renderGallery();
    // Cat A has only Alpha (source X); source Y has only Beta, so the two together match nothing
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cat A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Src Y' }));

    expect(screen.getByText('No templates match')).toBeInTheDocument();
    expect(screen.queryByText('No templates found')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('names the search text in the category and data source lists when nothing matches', async () => {
    renderGallery();
    await userEvent.type(screen.getByLabelText('Search categories'), 'legalx');
    await userEvent.type(screen.getByLabelText('Search data sources'), 'snowflk');

    expect(screen.getByText('No categories match “legalx”')).toBeInTheDocument();
    expect(screen.getByText('No data sources match “snowflk”')).toBeInTheDocument();
  });
});
