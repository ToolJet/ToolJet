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

  it('sends a JSON body template as parsed JSON (not double-encoded) and replaces the default payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;
    const svc = makeService();
    const definition = {
      nodeName: 'approval1',
      outcomes: [{ key: 'approved' }],
      inputSchema: [],
      notification: { url: 'https://hook.test/x', method: 'POST', bodyTemplate: '{"amount": 42, "note": "hi"}' },
    };
    await svc.dispatchApprovalNotification(
      definition,
      { id: 'req-1', token: 'tok-1', expiresAt: null },
      {},
      'org-1',
      'development'
    );
    const [, options] = fetchMock.mock.calls[0];
    // Body is the template parsed then serialized once — no surrounding quotes/escaping.
    expect(options.body).toBe(JSON.stringify({ amount: 42, note: 'hi' }));
    // The default payload (requestId/token/...) is replaced by the template.
    expect(JSON.parse(options.body)).not.toHaveProperty('requestId');
  });

  it('resolves fx in the body template (bodyTemplate is passed through resolveWorkflowParameters)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;
    const svc = makeService();
    // resolve turns the template into concrete JSON, mimicking {{ }} resolution.
    svc.resolveWorkflowParameters = jest.fn(async (params: any) => ({
      ...params,
      bodyTemplate: '{"email":"manager@corp.test"}',
    }));
    const definition = {
      nodeName: 'approval1',
      notification: { url: 'https://hook.test/x', bodyTemplate: '{"email":"{{ manager }}"}' },
    };
    await svc.dispatchApprovalNotification(
      definition,
      { id: 'req-1', token: 'tok-1', expiresAt: null },
      { manager: 'manager@corp.test' },
      'org-1',
      'development'
    );
    expect(svc.resolveWorkflowParameters).toHaveBeenCalledWith(
      expect.objectContaining({ bodyTemplate: '{"email":"{{ manager }}"}' }),
      expect.anything(),
      'org-1',
      'development'
    );
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ email: 'manager@corp.test' });
  });

  it('falls back to the default payload when no body template is set', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;
    const svc = makeService();
    const definition = {
      nodeName: 'approval1',
      outcomes: [],
      inputSchema: [],
      notification: { url: 'https://hook.test/x' },
    };
    await svc.dispatchApprovalNotification(
      definition,
      { id: 'req-1', token: 'tok-1', expiresAt: null },
      {},
      'org-1',
      'development'
    );
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({ requestId: 'req-1', token: 'tok-1' });
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
