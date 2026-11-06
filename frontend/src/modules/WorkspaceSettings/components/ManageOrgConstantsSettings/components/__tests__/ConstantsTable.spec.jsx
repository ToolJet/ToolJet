import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstantsTable from '../ConstantsTable';

const COLUMNS = ['Name', 'Value', 'Last modified', 'Modified by', 'Owner', 'Source'];

const globalItem = {
  kind: 'constant',
  id: 'c1',
  name: 'API_URL',
  type: 'Global',
  source: 'workspace',
  value: 'https://api.example.com',
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u2', name: 'Dev Patel' },
};
const secretItem = { ...globalItem, id: 'c2', name: 'STRIPE_KEY', type: 'Secret', value: null, source: 'env' };

const renderTable = (props) =>
  render(<ConstantsTable items={[]} status="success" variant="Global" searchKey="" {...props} />);

describe('ConstantsTable', () => {
  describe('loading', () => {
    it.each(['idle', 'loading'])('shows the column headers and 8 skeleton rows while status is %s', (status) => {
      renderTable({ status });
      COLUMNS.forEach((name) => expect(screen.getByRole('columnheader', { name })).toBeInTheDocument());
      expect(screen.getAllByTestId('constants-skeleton-row')).toHaveLength(8);
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    });

    it('hides stale rows while the next list loads', () => {
      renderTable({ status: 'loading', items: [globalItem] });
      expect(screen.queryByText('API_URL')).not.toBeInTheDocument();
    });

    it('does not show an empty state while loading', () => {
      renderTable({ status: 'loading' });
      expect(screen.queryByText(/No .* yet/)).not.toBeInTheDocument();
    });
  });

  describe('rows', () => {
    it('renders a Global constant with its plain value, people and source', () => {
      renderTable({ items: [globalItem] });
      const row = screen.getByRole('row', { name: /API_URL/ });
      expect(within(row).getByText('https://api.example.com')).toBeInTheDocument();
      expect(within(row).getByText('Asha Rao')).toBeInTheDocument();
      expect(within(row).getByText('Dev Patel')).toBeInTheDocument();
      expect(within(row).getByText('Workspace')).toBeInTheDocument();
      expect(within(row).getByText(/2026/)).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
      expect(screen.queryAllByTestId('constants-skeleton-row')).toHaveLength(0);
    });

    it('masks the value of a Secret and labels environment-sourced constants', () => {
      renderTable({ items: [secretItem], variant: 'Secret' });
      const row = screen.getByRole('row', { name: /STRIPE_KEY/ });
      expect(within(row).getByText('********')).toBeInTheDocument();
      expect(within(row).getByText('Environment')).toBeInTheDocument();
    });

    it('shows a dash for a missing owner, modifier or date', () => {
      renderTable({ items: [{ ...globalItem, owner: null, modified_by: null, last_modified_at: null }] });
      const row = screen.getByRole('row', { name: /API_URL/ });
      expect(within(row).getAllByText('-')).toHaveLength(3);
    });
  });

  describe('empty', () => {
    it('explains the Secrets tab and offers to create a secret', async () => {
      const onCreate = jest.fn();
      renderTable({ variant: 'Secret', onCreate });
      expect(screen.getByText('No secrets yet')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Create secret' }));
      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it('explains the Globals tab', () => {
      renderTable({ variant: 'Global', onCreate: jest.fn() });
      expect(screen.getByText('No global constants yet')).toBeInTheDocument();
    });

    it('shows the search empty state, without a create button, when a search matches nothing', () => {
      renderTable({ searchKey: 'stripe', onCreate: jest.fn() });
      expect(screen.getByText('No constants found')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('drops the column headers when there is nothing to list', () => {
      renderTable();
      expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
    });

    it('omits the create button when the user cannot create', () => {
      renderTable({ variant: 'Secret' });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('error', () => {
    it('says the list failed to load and retries on request', async () => {
      const onRetry = jest.fn();
      renderTable({ status: 'error', onRetry });
      expect(screen.getByText("Couldn't load constants")).toBeInTheDocument();
      expect(screen.queryByText(/No .* yet/)).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
