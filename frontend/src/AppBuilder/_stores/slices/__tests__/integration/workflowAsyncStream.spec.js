// An async workflow query watches its run over SSE. The stream only opens with the token the
// trigger returned, so the App Builder must carry it from the trigger response to the stream URL.
// Real store and real service; only the browser's EventSource is stubbed (jsdom has none).
import useStore from '@/AppBuilder/_stores/store';

describe('async workflow query: watching the run', () => {
  beforeEach(() => {
    global.EventSource = jest.fn(() => ({ close: jest.fn() }));
  });

  afterEach(() => {
    delete global.EventSource;
  });

  it('opens the run stream with the token from the trigger response', () => {
    const { handler, error } = useStore.getState().queryPanel.setupAsyncWorkflowHandler({
      // What triggerWorkflow returns for an async run: { data: response.result, status }
      data: {
        status: 'ok',
        data: { status: 'workflow_triggered', executionId: 'exec-1', streamToken: '1800000000.tok' },
      },
      queryId: 'query-1',
      processQueryResults: jest.fn(),
      handleFailure: jest.fn(),
      shouldSetPreviewData: false,
      setPreviewData: jest.fn(),
      setResolvedQuery: jest.fn(),
    });

    expect(error).toBeUndefined();
    expect(handler.jobId).toBe('exec-1');
    expect(EventSource).toHaveBeenCalledWith(
      expect.stringMatching(/\/workflow_executions\/exec-1\/stream\?token=1800000000\.tok$/),
      { withCredentials: true }
    );
  });
});
