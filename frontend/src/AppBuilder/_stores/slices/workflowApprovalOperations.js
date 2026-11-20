// Workflows query List approvals / Resolve request, via the Approvals page endpoints.

export const WORKFLOW_OPERATIONS = {
  EXECUTE: 'execute',
  LIST_APPROVALS: 'listApprovals',
  RESOLVE_REQUEST: 'resolveRequest',
};

export const APPROVAL_STATUSES = ['pending', 'resolved', 'expired', 'cancelled'];

const DEFAULT_STATUSES = ['pending'];
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 100; // server limit (list-approvals.dto.ts)

// Every option the approval operations read; only these get `{{}}`-resolved at run time.
const APPROVAL_OPTION_KEYS = [
  'approvalWorkflowId',
  'approvalStatuses',
  'approver',
  'from',
  'to',
  'page',
  'perPage',
  'requestId',
  'executionId',
  'outcome',
  'resolveInput',
];

export const pickApprovalOperationOptions = (options = {}) =>
  APPROVAL_OPTION_KEYS.reduce((picked, key) => {
    if (options[key] !== undefined) picked[key] = options[key];
    return picked;
  }, {});

// Queries saved before operations existed carry no `operation` and must keep executing.
export const isExecuteOperation = (options) => !options?.operation || options.operation === WORKFLOW_OPERATIONS.EXECUTE;

const trimmedOrUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
};

const positiveIntOr = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export const buildApprovalListRequest = (options = {}) => ({
  filters: {
    workflowId: trimmedOrUndefined(options.approvalWorkflowId),
    statuses: Array.isArray(options.approvalStatuses) ? options.approvalStatuses : DEFAULT_STATUSES,
    approver: trimmedOrUndefined(options.approver),
    from: trimmedOrUndefined(options.from),
    to: trimmedOrUndefined(options.to),
    // The app's current environment, passed in at run time.
    environmentId: trimmedOrUndefined(options.environmentId),
  },
  page: positiveIntOr(options.page, DEFAULT_PAGE),
  perPage: Math.min(positiveIntOr(options.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE),
});

export const inputRowsToObject = (rows) =>
  (rows ?? []).reduce((input, row) => {
    const key = trimmedOrUndefined(row?.key);
    if (key !== undefined) input[key] = row.value;
    return input;
  }, {});

const failed = (message, statusCode) => ({
  status: 'failed',
  message,
  description: message,
  data: { message },
  ...(statusCode ? { metadata: { response: { statusCode } } } : {}),
});

// handleResponse rejects with `{ error, data, statusCode }`.
const failedFromServer = (e) => failed(e?.error || e?.message || 'Workflow approval request failed', e?.statusCode);

class ApprovalOperationError extends Error {}

const findPendingRequestId = async (executionId, service) => {
  // Two is enough to tell "exactly one" from "more than one".
  const { requests = [] } = await service.getAll({ executionId, statuses: ['pending'] }, 1, 2);
  // The list only returns requests the caller may resolve, so "none" covers both cases.
  if (requests.length === 0) {
    throw new ApprovalOperationError('No pending approval request you can resolve was found for this execution');
  }
  if (requests.length > 1) {
    throw new ApprovalOperationError('This execution has more than one pending approval request. Pass a request id.');
  }
  return requests[0].id;
};

const listApprovals = async (options, service) => {
  const { filters, page, perPage } = buildApprovalListRequest(options);
  return { status: 'ok', data: await service.getAll(filters, page, perPage) };
};

const resolveRequest = async (options, service) => {
  const requestId = trimmedOrUndefined(options.requestId);
  const executionId = trimmedOrUndefined(options.executionId);
  const outcome = trimmedOrUndefined(options.outcome);
  if (!requestId && !executionId) return failed('Request id or execution id is required');
  if (!outcome) return failed('Outcome is required');

  const targetId = requestId ?? (await findPendingRequestId(executionId, service));
  const response = await service.resolveById(targetId, outcome, inputRowsToObject(options.resolveInput));
  return { status: 'ok', data: { ...response, requestId: targetId } };
};

// Takes already-resolved options; never throws, returns the query runner's result shape.
export const runApprovalOperation = async (operation, options, service) => {
  try {
    switch (operation) {
      case WORKFLOW_OPERATIONS.LIST_APPROVALS:
        return await listApprovals(options ?? {}, service);
      case WORKFLOW_OPERATIONS.RESOLVE_REQUEST:
        return await resolveRequest(options ?? {}, service);
      default:
        return failed(`Unknown workflow operation: ${operation}`);
    }
  } catch (e) {
    if (e instanceof ApprovalOperationError) return failed(e.message);
    return failedFromServer(e);
  }
};
