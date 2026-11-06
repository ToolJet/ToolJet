/**
 * A Table expanded row inside a ListView copy record keeps the copy flag, so the builder keeps it read-only
 * (Listview-BLD-003). The canvas is replaced by a probe that reads the context, because only the context matters here.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SubcontainerContext from '@/AppBuilder/_contexts/SubcontainerContext';
import { ExpandedRowContainer } from '../_components/TableData/_components/ExpandedRowContainer';

jest.mock('@/AppBuilder/AppCanvas/Container', () => {
  const mockReact = require('react');
  const { useSubcontainerContext: mockUseContext } = require('@/AppBuilder/_contexts/SubcontainerContext');
  return {
    Container: () => {
      const { listviewCopy } = mockUseContext();
      return mockReact.createElement('span', { 'data-testid': 'probe' }, String(!!listviewCopy));
    },
  };
});

const virtualizer = { resizeItem: jest.fn() };
const mountIn = (listviewCopy) =>
  render(
    <SubcontainerContext.Provider value={{ contextPath: [{ containerId: 'lv', index: 0 }], listviewCopy }}>
      <table>
        <tbody>
          <ExpandedRowContainer
            tableId="tbl"
            rowIndex={0}
            top={0}
            canvasWidth={400}
            virtualizer={virtualizer}
            virtualItemIndex={0}
          />
        </tbody>
      </table>
    </SubcontainerContext.Provider>
  );

describe('Table expanded row in a ListView copy record', () => {
  test('[Listview-BLD-003] the expanded row canvas still sees the copy flag', () => {
    // Break this catches: the expanded row context dropping the flag, so a Table in page 2 record 1 is editable.
    mountIn(true);
    expect(screen.getByTestId('probe').textContent).toBe('true');
  });

  test('[Listview-BLD-003] outside a copy record the flag stays off', () => {
    // Break this catches: the flag forced on for every expanded row.
    mountIn(false);
    expect(screen.getByTestId('probe').textContent).toBe('false');
  });
});
