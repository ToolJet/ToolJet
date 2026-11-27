import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataSourceSelectionBar from '../DataSourceSelectionBar';

const mockPin = jest.fn();
const mockClearSelection = jest.fn();
let mockIsBranchLocked = false;

jest.mock('@/_services/globalDatasource.mutations', () => ({
  usePinDataSourceResources: () => ({ mutate: mockPin, isPending: false }),
}));
jest.mock('@/_stores/dataSourcesDashboardStore', () => ({
  useDataSourcesDashboardStore: (selector) => selector({ clearSelection: mockClearSelection }),
}));
jest.mock('@/pages/AppsDashboard/hooks/useIsWorkspaceBranchLocked', () => ({
  useIsWorkspaceBranchLocked: () => ({ isBranchLocked: mockIsBranchLocked }),
}));
// The dialogs have their own specs; here only whether the bar opens them matters.
jest.mock('../DataSourceBulkDeleteDialog', () => ({ kind }) => <div role="dialog" aria-label={`Delete ${kind}`} />);
jest.mock('../DataSourceBulkFolderActionDialog', () => ({ action }) => <div role="dialog" aria-label={action} />);
jest.mock('@/components/ui/Rocket/DropdownMenu', () => ({ trigger, sections }) => (
  <div>
    {trigger}
    {sections[0].items.map((item) => (
      <button key={item.id} type="button" disabled={item.disabled} onClick={item.onSelect}>
        {item.label}
      </button>
    ))}
  </div>
));

const renderBar = (props = {}) =>
  render(
    <DataSourceSelectionBar
      kind="data_source"
      selectedRowIds={['data_source:d-1', 'data_source:d-2']}
      pageState="some"
      {...props}
    />
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockIsBranchLocked = false;
});

describe('DataSourceSelectionBar', () => {
  test('counts the selection and pins it, clearing the selection after', async () => {
    renderBar();
    expect(screen.getByText('2 datasources selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(mockPin).toHaveBeenCalledWith(
      { resourceType: 'data_source', resourceIds: ['d-1', 'd-2'] },
      { onSuccess: mockClearSelection }
    );
  });

  test('says when the whole page is selected and hides Pin and Folder', () => {
    renderBar({ pageState: 'all' });
    expect(screen.getByText('All 2 datasources on this page selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move to folder' })).not.toBeInTheDocument();
  });

  test('offers folder moves only for data sources', () => {
    renderBar({ kind: 'folder', selectedRowIds: ['folder:f-1'] });
    expect(screen.getByText('1 folder selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move to folder' })).not.toBeInTheDocument();
  });

  test('opens the move dialog and the delete dialog', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Move to folder' }));
    expect(screen.getByRole('dialog', { name: 'move' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog', { name: 'Delete data_source' })).toBeInTheDocument();
  });

  test('disables delete, move and remove on a locked branch', () => {
    mockIsBranchLocked = true;
    renderBar();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move to folder' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove from folder' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled();
  });
});
