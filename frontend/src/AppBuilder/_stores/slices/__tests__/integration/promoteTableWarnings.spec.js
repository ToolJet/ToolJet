// App promote succeeds even when a ToolJet Database table the app uses is behind on migrations in
// the target environment; the server reports those tables as `tableWarnings`. The builder must be
// told, or the promoted app runs against an older schema without anyone knowing.
//
// The real composed store is driven directly; only `react-hot-toast` is stubbed, because the
// warning is reported through it and there is no other way to observe it.
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
import toast from 'react-hot-toast';

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1 };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };

function servePromote(tableWarnings) {
  server.use(
    http.put('*/v2/apps/:appId/versions/:versionId/promote', () =>
      HttpResponse.json({
        editorEnvironment: STAGING,
        environments: [DEVELOPMENT, STAGING],
        tableWarnings,
      })
    )
  );
}

async function promote() {
  useStore.setState((state) => {
    state.selectedEnvironment = DEVELOPMENT;
    state.appStore.modules.canvas = { ...state.appStore.modules.canvas, app: { appId: 'app-1' } };
  });
  const onSuccess = jest.fn();
  const onFailure = jest.fn();
  await useStore.getState().promoteAppVersionAction('version-1', onSuccess, onFailure);
  expect(onFailure).not.toHaveBeenCalled();
  expect(onSuccess).toHaveBeenCalled();
}

const toastMessages = () => toast.mock.calls.map(([message]) => message);

describe('app promote with ToolJet Database tables behind on migrations', () => {
  test('should warn about each table that is behind in the target environment', async () => {
    servePromote([{ tableId: 'table-1', tableName: 'orders', missingCount: 2 }]);

    await promote();

    expect(toastMessages()).toEqual([expect.stringContaining('"orders" is 2 migrations behind in staging')]);
  });

  test('should not warn when every table is up to date', async () => {
    servePromote([]);

    await promote();

    expect(toast).not.toHaveBeenCalled();
  });
});
