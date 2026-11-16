// Opening a query on a frozen version (e.g. synced default-branch draft) must not auto-save editor defaults.
// Real store; only `react-hot-toast` is stubbed to observe the failure toast.
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.loading = jest.fn();
  toast.dismiss = jest.fn();
  toast.custom = jest.fn();
  return { __esModule: true, default: toast, toast };
});
import { toast } from 'react-hot-toast';

const QUERY = {
  id: 'query-1',
  name: 'deleteOrders',
  options: { operation: 'delete_rows', delete_rows: { limit: 1, order_column_id: 'column-id' } },
};

// saveData is throttled (500 ms).
const settle = () => new Promise((resolve) => setTimeout(resolve, 600));

function serveQueryUpdate(status) {
  const updates = [];
  server.use(
    http.patch('*/data-queries/:queryId/versions/:versionId', ({ params }) => {
      updates.push(params.queryId);
      return status === 403
        ? HttpResponse.json(
            {
              statusCode: 403,
              message: 'This query is synced with git on the default branch. Create a feature branch to make changes.',
            },
            { status: 403 }
          )
        : HttpResponse.json({ updated_at: '2026-10-26T00:00:00.000Z' });
    })
  );
  return updates;
}

function openVersion({ frozen }) {
  useStore.setState((state) => {
    state.currentVersionId = 'version-1';
  });
  useStore.getState().setIsEditorFreezed(frozen);
}

describe('saving a query', () => {
  afterEach(() => toast.error.mockClear());

  test('should not send the update or report a failure when the editor is frozen', async () => {
    const updates = serveQueryUpdate(403);
    openVersion({ frozen: true });

    useStore.getState().dataQuery.saveData(QUERY);
    await settle();

    expect(updates).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('should send the update when the editor is editable', async () => {
    const updates = serveQueryUpdate(200);
    openVersion({ frozen: false });

    useStore.getState().dataQuery.saveData(QUERY);
    await settle();

    expect(updates).toEqual(['query-1']);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
