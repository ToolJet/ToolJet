import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataSourcePinButton from '../DataSourcePinButton';

const mockPin = jest.fn();
const mockUnpin = jest.fn();

jest.mock('@/_services/globalDatasource.mutations', () => ({
  usePinDataSourceResources: () => ({ mutate: mockPin, isPending: false }),
  useUnpinDataSourceResource: () => ({ mutate: mockUnpin, isPending: false }),
}));
jest.mock(
  '@/components/ui/Rocket/Tooltip',
  () =>
    ({ children }) =>
      children
);

const item = (overrides = {}) => ({
  id: 'd-1',
  name: 'orders_db',
  kind: 'data_source',
  pinned: false,
  actions: { edit: true, delete: true, pin: true },
  ...overrides,
});

beforeEach(() => {
  mockPin.mockClear();
  mockUnpin.mockClear();
});

describe('DataSourcePinButton', () => {
  test('pins an unpinned data source', async () => {
    render(<DataSourcePinButton item={item()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pin orders_db datasource' }));
    expect(mockPin).toHaveBeenCalledWith({ resourceType: 'data_source', resourceIds: ['d-1'] });
  });

  test('unpins a pinned folder', async () => {
    render(<DataSourcePinButton item={item({ kind: 'folder', name: 'Prod', pinned: true })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Unpin Prod folder' }));
    expect(mockUnpin).toHaveBeenCalledWith({ resourceType: 'folder', resourceId: 'd-1' });
  });

  test('is disabled when the server does not allow pinning', () => {
    render(<DataSourcePinButton item={item({ actions: { edit: true, delete: true, pin: false } })} />);
    expect(screen.getByRole('button', { name: 'Pin orders_db datasource' })).toBeDisabled();
  });
});
