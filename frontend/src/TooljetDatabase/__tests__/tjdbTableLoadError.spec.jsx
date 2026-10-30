// A refused table read (for example a 403 after a licence change) must end the loading state.
// Left on, the table view shows its spinner forever and the error toast is the only sign of failure.
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderHook, waitFor } from '@testing-library/react';
import { usePostgrestQueryBuilder } from '@/TooljetDatabase/usePostgrestQueryBuilder';

describe('usePostgrestQueryBuilder | failed table read', () => {
  it('should clear the loading state when the table read is refused', async () => {
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Multi-environment is not enabled for this organization.' },
          { status: 403 }
        )
      )
    );
    const setLoadingState = jest.fn();
    const { result } = renderHook(() =>
      usePostgrestQueryBuilder({
        organizationId: 'org-1',
        selectedTable: { id: 'table-1' },
        setSelectedTableData: jest.fn(),
        setTotalRecords: jest.fn(),
        setLoadingState,
      })
    );

    result.current.handleRefetchQuery();

    expect(setLoadingState).toHaveBeenCalledWith(true);
    await waitFor(() => expect(setLoadingState).toHaveBeenLastCalledWith(false));
  });
});
