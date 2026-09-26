/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { workflowApprovalsService } = require('../workflow_approvals.service');

beforeEach(() => {
  fetch.mockClear();
});

/** The `from`/`to` value the URL carried, decoded. */
function sentParam(name) {
  const url = new URL(fetch.mock.calls[0][0]);
  return url.searchParams.get(name);
}

describe('workflowApprovalsService.getAll — date range', () => {
  // The date inputs emit a bare `YYYY-MM-DD`. Sent as-is it is read server-side as midnight UTC,
  // so `created_at <= :to` excluded the entire day the user selected: "to today" returned nothing
  // created today. The service converts the picked calendar day into the instants it spans in the
  // viewer's own timezone before sending it.
  it('sends `to` as the last instant of the selected local day, not its midnight', async () => {
    await workflowApprovalsService.getAll({ to: '2026-09-24' });

    const to = sentParam('to');
    expect(to).toBe(new Date(2026, 8, 24, 23, 59, 59, 999).toISOString());
    expect(to).not.toBe('2026-09-24');
    // Whatever the runner's timezone, the instant sent must be strictly after local midnight of
    // that day — which is the property the bug violated.
    expect(new Date(to).getTime()).toBeGreaterThan(new Date(2026, 8, 24, 0, 0, 0, 0).getTime());
  });

  it('sends `from` as the first instant of the selected local day', async () => {
    await workflowApprovalsService.getAll({ from: '2026-09-24' });

    expect(sentParam('from')).toBe(new Date(2026, 8, 24, 0, 0, 0, 0).toISOString());
  });

  it('makes a single-day range (from === to) span that whole day', async () => {
    await workflowApprovalsService.getAll({ from: '2026-09-24', to: '2026-09-24' });

    expect(new Date(sentParam('from')).getTime()).toBeLessThan(new Date(sentParam('to')).getTime());
  });

  it('passes a value that already carries a time straight through', async () => {
    await workflowApprovalsService.getAll({ to: '2026-09-24T09:30:00.000Z' });

    expect(sentParam('to')).toBe('2026-09-24T09:30:00.000Z');
  });

  it('omits both bounds when no dates are selected', async () => {
    await workflowApprovalsService.getAll({ statuses: ['pending'] });

    expect(sentParam('from')).toBeNull();
    expect(sentParam('to')).toBeNull();
  });
});

describe('workflowApprovalsService.getAll — other filters', () => {
  it('sends the workflow filter as app_id', async () => {
    await workflowApprovalsService.getAll({ appId: 'wf-1' });

    expect(sentParam('app_id')).toBe('wf-1');
  });

  it('sends the folder filter as folder_id', async () => {
    await workflowApprovalsService.getAll({ folderId: 'folder-1' });

    expect(sentParam('folder_id')).toBe('folder-1');
  });

  it('omits folder_id entirely when no folder is selected', async () => {
    // "All workflows" is the absence of the filter, not a folder id the server has to interpret.
    await workflowApprovalsService.getAll({ statuses: ['pending'] });

    expect(sentParam('folder_id')).toBeNull();
  });

  it('sends the environment filter as environment_id', async () => {
    await workflowApprovalsService.getAll({ environmentId: 'env-1' });

    expect(sentParam('environment_id')).toBe('env-1');
  });

  it('omits environment_id entirely when no environment is selected', async () => {
    // "All environments" is the absence of the filter — sending the page's `all` sentinel would
    // have the server look for an environment with that id and return nothing.
    await workflowApprovalsService.getAll({ statuses: ['pending'] });

    expect(sentParam('environment_id')).toBeNull();
  });

  it('repeats `status` once per selected status', async () => {
    await workflowApprovalsService.getAll({ statuses: ['pending', 'resolved'] });

    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.getAll('status')).toEqual(['pending', 'resolved']);
  });
});
