import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataSourceUnsyncedButton from '../DataSourceUnsyncedButton';

const mockInvalidateQueries = jest.fn();
let mockBranchState;

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));
jest.mock('@/_stores/workspaceBranchesStore', () => ({
  useWorkspaceBranchesStore: (selector) => selector(mockBranchState),
}));
jest.mock(
  '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal',
  () => ({
    PushAppsModal: ({ show, resourceType, resourceName, onSuccess }) =>
      show ? (
        <div role="dialog" aria-label={`Push ${resourceType} ${resourceName}`}>
          <button type="button" onClick={onSuccess}>
            Push
          </button>
        </div>
      ) : null,
  }),
  { virtual: true }
);
jest.mock(
  '@/components/ui/Rocket/Tooltip',
  () =>
    ({ children }) =>
      children
);

const dataSource = (overrides = {}) => ({
  id: 'd-1',
  name: 'orders_db',
  kind: 'data_source',
  is_synced: false,
  ...overrides,
});
const defaultBranch = { id: 'b-main', is_default: true };

beforeEach(() => {
  mockInvalidateQueries.mockClear();
  mockBranchState = { isGitSyncConfigured: true, currentBranch: defaultBranch };
});

describe('DataSourceUnsyncedButton', () => {
  test('shows on the default branch for a data source git has not synced', () => {
    render(<DataSourceUnsyncedButton dataSource={dataSource()} />);
    expect(screen.getByRole('button', { name: 'Push orders_db to git' })).toBeInTheDocument();
  });

  test.each([
    ['git sync is not configured', () => (mockBranchState.isGitSyncConfigured = false), {}],
    ['no branch is loaded', () => (mockBranchState.currentBranch = null), {}],
    ['on a feature branch', () => (mockBranchState.currentBranch = { id: 'b-1', is_default: false }), {}],
    ['the data source is synced', () => {}, { is_synced: true }],
    ['the list has no sync state yet', () => {}, { is_synced: undefined }],
  ])('stays hidden when %s', (_, arrange, overrides) => {
    arrange();
    render(<DataSourceUnsyncedButton dataSource={dataSource(overrides)} />);
    expect(screen.queryByRole('button', { name: /to git/ })).not.toBeInTheDocument();
  });

  test('opens the data source push modal and refreshes the list after a push', async () => {
    render(<DataSourceUnsyncedButton dataSource={dataSource()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Push orders_db to git' }));

    expect(screen.getByRole('dialog', { name: 'Push datasource orders_db' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['dataSourcesV2'] });
  });
});
