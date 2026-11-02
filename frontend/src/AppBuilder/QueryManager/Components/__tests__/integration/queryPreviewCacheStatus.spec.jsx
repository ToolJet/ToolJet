import React from 'react';
import { renderHook, screen } from '@testing-library/react';
import { AppBuilderTestSession, seedApp } from '@/test/app-builder';
import Preview from '../../Preview';
import useStore from '@/AppBuilder/_stores/store';

describe('query preview cache metadata', () => {
  let session;
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });
  beforeEach(async () => {
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'app-editor',
        capabilities: {
          network: [
            {
              method: 'post',
              url: 'http://localhost:3000/api/workflow_executions/workflow-1/trigger',
              json: {
                result: {
                  syncExecution: true,
                  executionStatus: 'completed',
                  data: [{ id: 1 }],
                  metadata: { cache: { status: 'miss', stored: false } },
                },
              },
            },
            ...['run', 'preview'].map((action) => ({
              method: 'post',
              url: `http://localhost:3000/api/data-queries/q-cache/versions/v1/${action}/env-1`,
              json: { status: 'ok', data: [{ id: 1 }], metadata: { cache: { status: 'miss', stored: false } } },
            })),
          ],
        },
      },
    });
    Element.prototype.scrollIntoView = jest.fn();
    await selectQuery({ enabled: true });
  });

  async function selectQuery(responseCache) {
    await session.store.act((state) => {
      state.dataQuery.setQueries(
        [{ id: 'q-cache', name: 'getRows', kind: 'restapi', options: { responseCache } }],
        'canvas'
      );
      state.queryPanel.setSelectedQuery('q-cache');
    });
  }

  // Break this catches: showing cache feedback to builders who did not enable caching.
  test.each([undefined, { enabled: false }])(
    '[QueryCache-STATUS-006] hides feedback when query caching is disabled (%j)',
    async (responseCache) => {
      await selectQuery(responseCache);
      await session.store.act((state) => state.queryPanel.setPreviewData([], { status: 'bypass' }));
      session.render(<Preview calculatePreviewHeight={() => {}} />);
      expect(screen.queryByRole('status', { name: 'Query cache status' })).not.toBeInTheDocument();
    }
  );

  // Break this catches: leaving feedback visible after caching is switched off.
  test('[QueryCache-STATUS-007] hides a previous cache hit when caching is disabled', async () => {
    await session.store.act((state) => state.queryPanel.setPreviewData([], { status: 'hit' }));
    session.render(<Preview calculatePreviewHeight={() => {}} />);
    expect(screen.getByRole('status', { name: 'Query cache status' })).toHaveTextContent('Cache hit');
    await selectQuery({ enabled: false });
    expect(screen.queryByRole('status', { name: 'Query cache status' })).not.toBeInTheDocument();
  });

  // Break this catches: losing cache metadata between the preview action and its status display.
  test('[QueryCache-STATUS-003] shows the preview outcome and clears it for the next response without metadata', async () => {
    await session.store.act((state) => state.queryPanel.setPreviewData([{ id: 1 }], { status: 'miss', stored: false }));
    const { result } = renderHook(() => useStore((state) => state.queryPanel.queryPreviewCache));
    session.render(<Preview calculatePreviewHeight={() => {}} />);
    expect(result.current).toEqual({ status: 'miss', stored: false });
    expect(screen.getByRole('status')).toHaveTextContent('Cache miss · not saved');
    await session.store.act((state) => state.queryPanel.setPreviewData([{ id: 2 }]));
    expect(screen.queryByRole('status', { name: 'Query cache status' })).not.toBeInTheDocument();
  });

  // Break this catches: leaving the previous response's badge visible during another execution.
  test('[QueryCache-STATUS-004] hides the previous outcome while a query is loading', async () => {
    await session.store.act((state) => state.queryPanel.setPreviewData([], { status: 'hit', ageMs: 0 }));
    session.render(<Preview calculatePreviewHeight={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Cache hit');
    await session.store.act((state) => state.queryPanel.setPreviewLoading(true));
    expect(screen.queryByRole('status', { name: 'Query cache status' })).not.toBeInTheDocument();
  });
  // Break this catches: dropping response metadata when Run or Preview publishes its displayed data.
  test.each(['run', 'preview', 'workflow run', 'workflow preview'])(
    '[QueryCache-STATUS-005] displays cache metadata from the %s HTTP response',
    async (action) => {
      seedApp({});
      const query = {
        id: 'q-cache',
        name: 'getRows',
        kind: action.startsWith('workflow') ? 'workflows' : 'restapi',
        options: {
          method: 'get',
          url: 'https://example.test/rows',
          workflowId: 'workflow-1',
          syncExecution: true,
          responseCache: { enabled: true },
        },
      };
      await session.store.act((state) => {
        state.setApp({ appId: 'app-1', currentAppEnvironmentId: 'env-1' });
        state.setCurrentVersionId('v1');
        state.setSelectedEnvironment({ id: 'env-1' });
        state.dataQuery.setQueries([query], 'canvas');
        state.queryPanel.setSelectedQuery(query.id);
        state.setQueryMapping('canvas');
        state.registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas');
      });
      session.render(<Preview calculatePreviewHeight={() => {}} />);
      await session.store.act((state) =>
        action.endsWith('preview')
          ? state.queryPanel.previewQuery(query)
          : state.queryPanel.runQuery(query.id, query.name, undefined, 'edit', {}, undefined, undefined, true)
      );
      expect(screen.getByRole('status', { name: 'Query cache status' })).toHaveTextContent('Cache miss · not saved');
    }
  );
});
