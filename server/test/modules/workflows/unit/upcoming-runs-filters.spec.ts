/** @group workflows */

import { SelectQueryBuilder } from 'typeorm';
import { WorkflowSchedulerService } from '@ee/workflows/services/workflow-scheduler.service';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { UpcomingRunFilters } from '@modules/workflows/types/upcoming-runs';

type RecordingQueryBuilder = {
  calls: Array<{ clause: string; params: Record<string, unknown> }>;
  andWhere: (clause: string, params?: Record<string, unknown>) => RecordingQueryBuilder;
};

const makeQueryBuilder = (): RecordingQueryBuilder => {
  const calls: RecordingQueryBuilder['calls'] = [];
  const qb: RecordingQueryBuilder = {
    calls,
    andWhere: (clause, params = {}) => {
      calls.push({ clause, params });
      return qb;
    },
  };
  return qb;
};

type ApplyUpcomingFilters = (query: SelectQueryBuilder<WorkflowSchedule>, filters: UpcomingRunFilters) => void;

const applyFilters = (filters: UpcomingRunFilters) => {
  const qb = makeQueryBuilder();
  const { applyUpcomingFilters } = WorkflowSchedulerService.prototype as unknown as {
    applyUpcomingFilters: ApplyUpcomingFilters;
  };
  applyUpcomingFilters.call({}, qb as unknown as SelectQueryBuilder<WorkflowSchedule>, filters);
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

  it.each([
    ['environmentId', { environmentId: '' }],
    ['appId', { appId: '' }],
    ['folderId', { folderId: '' }],
  ])('ignores an empty %s instead of filtering on it', (_name, filters) => {
    expect(applyFilters(filters)).toHaveLength(0);
  });

  it('parameterises every value rather than inlining it', () => {
    const hostile = "'; DROP TABLE workflow_schedules; --";
    const calls = applyFilters({ environmentId: hostile, appId: hostile, folderId: hostile });
    calls.forEach((call) => {
      expect(call.clause).not.toContain('DROP TABLE');
      expect(Object.values(call.params)).toContain(hostile);
    });
  });
});
