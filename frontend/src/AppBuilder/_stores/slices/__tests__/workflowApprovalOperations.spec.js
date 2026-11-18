import {
  WORKFLOW_OPERATIONS,
  buildApprovalListRequest,
  inputRowsToObject,
  isExecuteOperation,
  pickApprovalOperationOptions,
  runApprovalOperation,
} from '../workflowApprovalOperations';

const fakeService = (overrides = {}) => ({
  getAll: jest.fn().mockResolvedValue({ requests: [], meta: { page: 1, perPage: 25, total: 0 } }),
  resolveById: jest.fn().mockResolvedValue({ status: 'resolved' }),
  ...overrides,
});

describe('isExecuteOperation', () => {
  it('treats a query saved before operations existed as Execute', () => {
    expect(isExecuteOperation({ workflowId: 'wf' })).toBe(true);
    expect(isExecuteOperation(undefined)).toBe(true);
  });

  it('is false for the approval operations', () => {
    expect(isExecuteOperation({ operation: WORKFLOW_OPERATIONS.LIST_APPROVALS })).toBe(false);
    expect(isExecuteOperation({ operation: WORKFLOW_OPERATIONS.RESOLVE_REQUEST })).toBe(false);
  });
});

describe('buildApprovalListRequest', () => {
  it('maps the editor options onto service filters', () => {
    expect(
      buildApprovalListRequest({
        approvalWorkflowId: 'wf-ref',
        approvalStatuses: ['pending', 'resolved'],
        approver: ' ana@x.io ',
        from: '2026-11-01',
        to: '2026-11-17',
        page: '2',
        perPage: 50,
      })
    ).toEqual({
      filters: {
        workflowId: 'wf-ref',
        statuses: ['pending', 'resolved'],
        approver: 'ana@x.io',
        from: '2026-11-01',
        to: '2026-11-17',
      },
      page: 2,
      perPage: 50,
    });
  });

  it("filters by the list's own workflow, never the Execute operation's workflow", () => {
    expect(buildApprovalListRequest({ workflowId: 'execute-wf' }).filters.workflowId).toBeUndefined();
  });

  it("scopes the list to the app's current environment", () => {
    expect(buildApprovalListRequest({ environmentId: 'env-dev' }).filters).toMatchObject({ environmentId: 'env-dev' });
  });

  it('lists every environment when the app has no current environment', () => {
    expect(buildApprovalListRequest({ environmentId: '  ' }).filters.environmentId).toBeUndefined();
  });

  it('defaults to pending requests of every workflow, first page of 25', () => {
    expect(buildApprovalListRequest({})).toEqual({
      filters: { workflowId: undefined, statuses: ['pending'], approver: undefined, from: undefined, to: undefined },
      page: 1,
      perPage: 25,
    });
  });

  it('lists every status when the status selection is cleared', () => {
    expect(buildApprovalListRequest({ approvalStatuses: [] }).filters.statuses).toEqual([]);
  });

  it('falls back to the defaults for a page or page size that is not a positive integer', () => {
    expect(buildApprovalListRequest({ page: 'abc', perPage: -3 })).toMatchObject({ page: 1, perPage: 25 });
  });

  it('caps the page size at the server maximum', () => {
    expect(buildApprovalListRequest({ perPage: 500 }).perPage).toBe(100);
  });
});

describe('inputRowsToObject', () => {
  it('turns key-value rows into an object, dropping rows with a blank key', () => {
    expect(
      inputRowsToObject([
        { key: 'comment', value: 'ok' },
        { key: ' ', value: 'ignored' },
        { key: 'amount', value: 42 },
      ])
    ).toEqual({ comment: 'ok', amount: 42 });
  });

  it('is an empty object for no rows', () => {
    expect(inputRowsToObject(undefined)).toEqual({});
  });
});

describe('runApprovalOperation', () => {
  describe('List approvals', () => {
    it('returns the list response as the query data', async () => {
      const list = { requests: [{ id: 'r1' }], meta: { page: 1, perPage: 25, total: 1 } };
      const service = fakeService({ getAll: jest.fn().mockResolvedValue(list) });

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.LIST_APPROVALS,
        { approvalWorkflowId: 'wf-ref', environmentId: 'env-dev' },
        service
      );

      expect(service.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ workflowId: 'wf-ref', statuses: ['pending'], environmentId: 'env-dev' }),
        1,
        25
      );
      expect(result).toEqual({ status: 'ok', data: list });
    });

    it('reports a server error as a failed query carrying the server message', async () => {
      const service = fakeService({
        getAll: jest.fn().mockRejectedValue({ error: 'Unauthorized', statusCode: 401, data: { message: 'x' } }),
      });

      const result = await runApprovalOperation(WORKFLOW_OPERATIONS.LIST_APPROVALS, {}, service);

      expect(result).toMatchObject({
        status: 'failed',
        message: 'Unauthorized',
        description: 'Unauthorized',
        metadata: { response: { statusCode: 401 } },
      });
    });
  });

  describe('Resolve request', () => {
    it('resolves by request id with the outcome and input', async () => {
      const service = fakeService();

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { requestId: ' req-1 ', outcome: 'approve', resolveInput: [{ key: 'comment', value: 'lgtm' }] },
        service
      );

      expect(service.resolveById).toHaveBeenCalledWith('req-1', 'approve', { comment: 'lgtm' });
      expect(service.getAll).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok', data: { status: 'resolved', requestId: 'req-1' } });
    });

    it('prefers the request id when both ids are given', async () => {
      const service = fakeService();

      await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { requestId: 'req-1', executionId: 'run-1', outcome: 'approve' },
        service
      );

      expect(service.resolveById).toHaveBeenCalledWith('req-1', 'approve', {});
      expect(service.getAll).not.toHaveBeenCalled();
    });

    it("resolves an execution's single pending request when only the execution id is given", async () => {
      const service = fakeService({
        getAll: jest.fn().mockResolvedValue({ requests: [{ id: 'req-9' }], meta: { total: 1 } }),
      });

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        // The execution id alone names the run, so the app's environment must not narrow the lookup.
        { executionId: 'run-1', outcome: 'reject', environmentId: 'env-dev' },
        service
      );

      expect(service.getAll).toHaveBeenCalledWith({ executionId: 'run-1', statuses: ['pending'] }, 1, 2);
      expect(service.resolveById).toHaveBeenCalledWith('req-9', 'reject', {});
      expect(result).toEqual({ status: 'ok', data: { status: 'resolved', requestId: 'req-9' } });
    });

    it('fails without resolving when the execution has no pending request', async () => {
      const service = fakeService();

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { executionId: 'run-1', outcome: 'approve' },
        service
      );

      expect(service.resolveById).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'failed',
        message: 'No pending approval request you can resolve was found for this execution',
      });
    });

    it('fails without resolving when the execution has more than one pending request', async () => {
      const service = fakeService({
        getAll: jest.fn().mockResolvedValue({ requests: [{ id: 'a' }, { id: 'b' }], meta: { total: 2 } }),
      });

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { executionId: 'run-1', outcome: 'approve' },
        service
      );

      expect(service.resolveById).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'failed',
        message: 'This execution has more than one pending approval request. Pass a request id.',
      });
    });

    it('fails without calling the server when neither id is given', async () => {
      const service = fakeService();

      const result = await runApprovalOperation(WORKFLOW_OPERATIONS.RESOLVE_REQUEST, { outcome: 'approve' }, service);

      expect(service.getAll).not.toHaveBeenCalled();
      expect(service.resolveById).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'failed', message: 'Request id or execution id is required' });
    });

    it('fails without calling the server when the outcome is blank', async () => {
      const service = fakeService();

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { requestId: 'req-1', outcome: '  ' },
        service
      );

      expect(service.resolveById).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'failed', message: 'Outcome is required' });
    });

    it('reports a rejected resolve (e.g. not an approver) as a failed query with the server message', async () => {
      const service = fakeService({
        resolveById: jest.fn().mockRejectedValue({
          error: 'Not authorized to resolve this approval request',
          statusCode: 403,
        }),
      });

      const result = await runApprovalOperation(
        WORKFLOW_OPERATIONS.RESOLVE_REQUEST,
        { requestId: 'req-1', outcome: 'approve' },
        service
      );

      expect(result).toMatchObject({
        status: 'failed',
        message: 'Not authorized to resolve this approval request',
        metadata: { response: { statusCode: 403 } },
      });
    });
  });

  it('fails for an unknown operation', async () => {
    const result = await runApprovalOperation('bogus', {}, fakeService());

    expect(result).toMatchObject({ status: 'failed', message: 'Unknown workflow operation: bogus' });
  });
});

describe('pickApprovalOperationOptions', () => {
  it('keeps only the approval fields, so params and transformation code are never resolved for them', () => {
    expect(
      pickApprovalOperationOptions({
        operation: 'listApprovals',
        workflowId: 'execute-wf',
        approvalWorkflowId: 'wf',
        approver: '{{x}}',
        params: [{ key: 'a', value: '{{b}}' }],
        transformation: 'return {{data}}',
      })
    ).toEqual({ approvalWorkflowId: 'wf', approver: '{{x}}' });
  });
});
