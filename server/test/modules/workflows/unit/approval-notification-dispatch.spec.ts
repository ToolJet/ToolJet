import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { EMAIL_EVENTS } from '@modules/email/constants';

/** @group workflows */
describe('WorkflowExecutionsService.dispatchApprovalNotification', () => {
  const makeService = () => {
    const svc: any = Object.create(WorkflowExecutionsService.prototype);
    svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    svc.resolveWorkflowParameters = jest.fn(async (params: any) => params); // no-op fx resolve
    svc.eventEmitter = { emit: jest.fn() };
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
      'development',
      { workflowName: 'Production deployment' }
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
      'development',
      { workflowName: 'Production deployment' }
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

  it('snapshots deduplicated email recipients from users, groups, and dynamic approvers', async () => {
    const svc = makeService();
    svc.resolveWorkflowParameters = jest.fn(async () => ({
      value: ['dynamic@example.com', 'shared@example.com'],
    }));
    svc.userRepository = {
      manager: {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            { userId: 'user-1', user: { id: 'user-1', email: 'direct@example.com' } },
            { userId: 'user-2', user: { id: 'user-2', email: 'shared@example.com' } },
          ])
          .mockResolvedValueOnce([{ userId: 'user-3' }, { userId: 'user-4' }, { userId: 'archived-user' }])
          .mockResolvedValueOnce([
            { userId: 'user-3', user: { id: 'user-3', email: 'group@example.com' } },
            { userId: 'user-4', user: { id: 'user-4', email: 'shared@example.com' } },
          ]),
      },
    };

    const snapshot = await svc.resolveApprovers(
      {
        approvers: {
          users: ['user-1', 'user-2'],
          groups: ['group-1'],
          dynamic: '{{ approverEmails }}',
        },
      },
      { approverEmails: ['dynamic@example.com'] },
      'org-1',
      'development'
    );

    expect(snapshot).toMatchObject({
      users: ['user-1', 'user-2'],
      groups: ['group-1'],
      emails: ['dynamic@example.com', 'shared@example.com'],
      notificationEmails: ['direct@example.com', 'shared@example.com', 'group@example.com', 'dynamic@example.com'],
    });
    expect(svc.userRepository.manager.find).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', status: 'active' }),
        relations: { user: true },
      })
    );
    expect(svc.userRepository.manager.find).toHaveBeenNthCalledWith(
      3,
      expect.any(Function),
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', status: 'active' }),
        relations: { user: true },
      })
    );
  });

  it('stores dynamic approver emails trimmed and lowercased, without blanks or duplicates', async () => {
    const svc = makeService();
    svc.resolveWorkflowParameters = jest.fn(async () => ({
      value: ['  Manager@Example.COM ', 'manager@example.com', '', 42],
    }));
    svc.userRepository = { manager: { find: jest.fn() } };

    const snapshot = await svc.resolveApprovers(
      { approvers: { dynamic: '{{ approverEmails }}' } },
      {},
      'org-1',
      'development'
    );

    expect(snapshot).toMatchObject({
      emails: ['manager@example.com'],
      notificationEmails: ['manager@example.com'],
    });
  });

  it('emits an approval email even when no webhook URL is configured', async () => {
    const svc = makeService();

    await svc.dispatchApprovalNotification(
      { nodeName: 'Manager approval', description: 'Review this deployment' },
      {
        id: 'req-1',
        token: 'tok-1',
        expiresAt: null,
        approversSnapshot: { notificationEmails: ['manager@example.com'] },
      },
      {},
      'org-1',
      'development',
      { workflowName: 'Production deployment' }
    );

    expect(svc.eventEmitter.emit).toHaveBeenCalledWith('emailEvent', {
      type: EMAIL_EVENTS.SEND_WORKFLOW_APPROVAL_EMAIL,
      payload: {
        to: ['manager@example.com'],
        organizationId: 'org-1',
        workflowName: 'Production deployment',
        nodeName: 'Manager approval',
        description: 'Review this deployment',
        reminder: false,
      },
    });
  });

  it('marks reminder emails so their subject and copy can distinguish them', async () => {
    const svc = makeService();

    await svc.dispatchApprovalNotification(
      { nodeName: 'Manager approval' },
      {
        id: 'req-1',
        token: 'tok-1',
        expiresAt: null,
        approversSnapshot: { notificationEmails: ['manager@example.com'] },
      },
      {},
      'org-1',
      'development',
      { reminder: true, workflowName: 'Production deployment' }
    );

    expect(svc.eventEmitter.emit).toHaveBeenCalledWith(
      'emailEvent',
      expect.objectContaining({
        type: EMAIL_EVENTS.SEND_WORKFLOW_APPROVAL_EMAIL,
        payload: expect.objectContaining({ reminder: true, workflowName: 'Production deployment' }),
      })
    );
  });
});

/** @group workflows */
describe('WorkflowExecutionsService.resolveHumanDescription', () => {
  const makeService = (resolve: (params: any) => any) => {
    const svc: any = Object.create(WorkflowExecutionsService.prototype);
    svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    svc.resolveWorkflowParameters = jest.fn(async (params: any) => resolve(params));
    return svc as WorkflowExecutionsService & any;
  };

  it('should resolve {{ }} in the description against the run state', async () => {
    const svc = makeService(() => ({ description: 'Amount 42' }));

    const description = await svc.resolveHumanDescription(
      'Amount {{startTrigger.params.amount}}',
      { startTrigger: { params: { amount: 42 } } },
      'org-1',
      'development'
    );

    expect(description).toBe('Amount 42');
  });

  it('should return plain text without resolving it', async () => {
    const svc = makeService(() => ({ description: 'changed' }));

    expect(await svc.resolveHumanDescription('Please review', {}, 'org-1', 'development')).toBe('Please review');
    expect(svc.resolveWorkflowParameters).not.toHaveBeenCalled();
  });

  it('should keep the raw text when resolving fails', async () => {
    const svc = makeService(() => {
      throw new Error('bad expression');
    });

    expect(await svc.resolveHumanDescription('Amount {{oops(}}', {}, 'org-1', 'development')).toBe('Amount {{oops(}}');
    expect(svc.logger.warn).toHaveBeenCalled();
  });
});
