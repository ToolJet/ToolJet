/** @group workflows */

import { WorkflowSchedulerService } from '@ee/workflows/services/workflow-scheduler.service';

const makeQueryBuilder = () => {
  const calls: Array<{ clause: string; params: Record<string, unknown> }> = [];
  const qb: any = {
    calls,
    andWhere: (clause: string, params: Record<string, unknown> = {}) => {
      calls.push({ clause, params });
      return qb;
    },
  };
  return qb;
};

// Called with an empty `this`: the method deliberately touches no instance state, which is what
// makes it testable without constructing the service and its queue/EntityManager dependencies.
const applyFilters = (filters: any) => {
  const qb = makeQueryBuilder();
  (WorkflowSchedulerService.prototype as any).applyUpcomingFilters.call({}, qb, filters);
  return qb.calls;
};

describe('WorkflowSchedulerService.applyUpcomingFilters', () => {
  it('applies nothing when no scope is given', () => {
    expect(applyFilters({})).toHaveLength(0);
  });

  it('narrows by environment', () => {
    const calls = applyFilters({ environmentId: 'env-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].clause).toContain('schedule.environment_id = :environmentId');
    expect(calls[0].params).toEqual({ environmentId: 'env-1' });
  });

  it('narrows by workflow', () => {
    const calls = applyFilters({ appId: 'app-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].clause).toContain('schedule.app_id = :appId');
    expect(calls[0].params).toEqual({ appId: 'app-1' });
  });

  // A join to folder_apps would change the row count if an app were ever in a folder twice,
  // silently duplicating schedules in the panel. Same rule the executions list follows.
  it('narrows by folder with a subquery, never a join', () => {
    const calls = applyFilters({ folderId: 'folder-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].clause).toContain('SELECT folder_apps.app_id');
    expect(calls[0].clause).not.toContain('JOIN');
    expect(calls[0].params).toEqual({ folderId: 'folder-1' });
  });

  it('combines every scope filter', () => {
    const calls = applyFilters({ environmentId: 'env-1', appId: 'app-1', folderId: 'folder-1' });
    expect(calls).toHaveLength(3);
    const clauses = calls.map((call) => call.clause).join(' | ');
    expect(clauses).toContain('schedule.environment_id = :environmentId');
    expect(clauses).toContain('schedule.app_id = :appId');
    expect(clauses).toContain('folder_apps.folder_id = :folderId');
  });

  // The executions status filter shipped broken in exactly this way: a value that reached no
  // predicate returned the entire workspace instead of erroring. An empty string is the shape a
  // querystring produces for an omitted parameter, so it must narrow nothing rather than match
  // rows whose column equals ''.
  it.each([
    ['environmentId', { environmentId: '' }],
    ['appId', { appId: '' }],
    ['folderId', { folderId: '' }],
  ])('ignores an empty %s instead of filtering on it', (_name, filters) => {
    expect(applyFilters(filters)).toHaveLength(0);
  });

  // Values are always parameterised, never concatenated — server/AGENTS.md's security rule, and
  // these three arrive straight from the querystring.
  it('parameterises every value rather than inlining it', () => {
    const hostile = "'; DROP TABLE workflow_schedules; --";
    const calls = applyFilters({ environmentId: hostile, appId: hostile, folderId: hostile });
    calls.forEach((call) => {
      expect(call.clause).not.toContain('DROP TABLE');
      expect(Object.values(call.params)).toContain(hostile);
    });
  });
});
