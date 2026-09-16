import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

/** @group workflows */
describe('WorkflowExecutionsService.dispatchApprovalNotification', () => {
  const makeService = () => {
    const svc: any = Object.create(WorkflowExecutionsService.prototype);
    svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    svc.resolveWorkflowParameters = jest.fn(async (params: any) => params); // no-op fx resolve
    return svc as WorkflowExecutionsService & any;
  };

  afterEach(() => jest.restoreAllMocks());

  it('POSTs the notification payload including the request token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;
    const svc = makeService();
    const definition = {
      nodeName: 'approval1',
      outcomes: [{ key: 'approved' }],
      inputSchema: [],
      notification: { url: 'https://hook.test/x', method: 'POST' },
    };
    await svc.dispatchApprovalNotification(
      definition,
      { id: 'req-1', token: 'tok-1', expiresAt: null },
      {},
      'org-1',
      'development'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hook.test/x');
    expect(JSON.parse(options.body)).toMatchObject({ requestId: 'req-1', token: 'tok-1', nodeName: 'approval1' });
  });

  it('does not throw when delivery fails', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const svc = makeService();
    const definition = { nodeName: 'approval1', notification: { url: 'https://hook.test/x' } };
    await expect(
      svc.dispatchApprovalNotification(
        definition,
        { id: 'req-1', token: 'tok-1', expiresAt: null },
        {},
        'org-1',
        'development'
      )
    ).resolves.toBeUndefined();
  });
});
