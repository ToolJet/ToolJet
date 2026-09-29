/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));
jest.mock('@/_services', () => ({
  authenticationService: { currentSessionValue: { current_user: { id: 'user-1' } } },
}));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { workflowExecutionsService } = require('../workflow_executions.service');

beforeEach(() => {
  fetch.mockClear();
});

/** The `from`/`to` value the URL carried, decoded. */
function sentParam(name) {
  const url = new URL(fetch.mock.calls[0][0]);
  return url.searchParams.get(name);
}

describe('workflowExecutionsService.getWorkspaceExecutions — date range', () => {
  it('sends `to` as the last instant of the selected local day, not its midnight', async () => {
    await workflowExecutionsService.getWorkspaceExecutions({ to: '2026-09-24' });

    const to = sentParam('to');
    expect(to).toBe(new Date(2026, 8, 24, 23, 59, 59, 999).toISOString());
    expect(to).not.toBe('2026-09-24');
  });

  it('sends `from` as the first instant of the selected local day', async () => {
    await workflowExecutionsService.getWorkspaceExecutions({ from: '2026-09-24' });

    expect(sentParam('from')).toBe(new Date(2026, 8, 24, 0, 0, 0, 0).toISOString());
  });

  it('makes a single-day range (from === to) span that whole day rather than returning nothing', async () => {
    await workflowExecutionsService.getWorkspaceExecutions({ from: '2026-09-24', to: '2026-09-24' });

    expect(new Date(sentParam('from')).getTime()).toBeLessThan(new Date(sentParam('to')).getTime());
  });

  it('passes a value that already carries a time straight through', async () => {
    await workflowExecutionsService.getWorkspaceExecutions({ to: '2026-09-24T09:30:00.000Z' });

    expect(sentParam('to')).toBe('2026-09-24T09:30:00.000Z');
  });

  it('omits both bounds when no dates are selected', async () => {
    await workflowExecutionsService.getWorkspaceExecutions({ statuses: ['running'] });

    expect(sentParam('from')).toBeNull();
    expect(sentParam('to')).toBeNull();
  });
});
