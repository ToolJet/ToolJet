/** @group workflows */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  WorkflowExecutionRepository,
  STATUS_FILTER_TO_PREDICATE,
} from '@modules/workflows/repositories/workflow-execution.repository';
import { ListExecutionsDto, EXECUTION_STATUS_FILTERS } from '@modules/workflows/dto/list-executions.dto';

// A QueryBuilder test double recording andWhere calls, so filter translation can be asserted
// without a database. The repository's SQL correctness is covered by the EXPLAIN check in Task 2.
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

const applyFilters = (filters: any) => {
  const qb = makeQueryBuilder();
  (WorkflowExecutionRepository.prototype as any).applyListFilters.call({}, qb, filters);
  return qb.calls;
};

describe('WorkflowExecutionRepository.applyListFilters', () => {
  // `status` is NOT NULL DEFAULT 'success', so a live run already carries 'success' before it has
  // run anything. These four pin the consequence: in-flight is expressed through `executed`, and
  // no predicate may test `status IS NULL` (which matches nothing) or a bare `status = 'success'`
  // (which matches every in-flight run as well as every successful one).
  it('translates the running filter into unfinished rows, not rows with a null status', () => {
    const calls = applyFilters({ statuses: ['running'] });
    expect(calls).toHaveLength(1);
    expect(calls[0].clause).toContain('execution.executed = false');
    expect(calls[0].clause).not.toContain('IS NULL');
  });

  it('excludes the definite statuses from the running filter', () => {
    const calls = applyFilters({ statuses: ['running'] });
    // A waiting, stopped or failed run is unfinished or not, but it is never "in flight".
    expect(calls[0].clause).toContain("NOT IN ('waiting', 'waiting_for_delay', 'terminated', 'failure')");
  });

  it('gates the success filter on executed, so an in-flight run is not reported as a success', () => {
    const calls = applyFilters({ statuses: ['success'] });
    expect(calls[0].clause).toContain('execution.executed = true');
    expect(calls[0].clause).toContain("execution.status = 'success'");
  });

  it('treats waiting and waiting_for_delay as one waiting filter', () => {
    const calls = applyFilters({ statuses: ['waiting'] });
    expect(calls[0].clause).toContain("execution.status IN ('waiting', 'waiting_for_delay')");
  });

  it('maps the failed filter onto the failure status the DB actually stores', () => {
    const calls = applyFilters({ statuses: ['failed'] });
    expect(calls[0].clause).toContain("execution.status = 'failure'");
  });

  it('combines running with terminal statuses in one predicate', () => {
    const calls = applyFilters({ statuses: ['running', 'success'] });
    expect(calls).toHaveLength(1);
    expect(calls[0].clause).toContain('OR');
    expect(calls[0].clause).toContain('execution.executed = false');
    expect(calls[0].clause).toContain('execution.executed = true');
  });

  it('filters folders by subquery, never by join, to protect index-ordered pagination', () => {
    const calls = applyFilters({ folderId: 'folder-1' });
    expect(calls[0].clause).toContain('SELECT folder_apps.app_id');
    expect(calls[0].clause).not.toContain('JOIN');
  });

  it('filters by workflow, environment, trigger and date range', () => {
    const calls = applyFilters({
      appId: 'app-1',
      environmentId: 'env-1',
      triggers: ['schedule'],
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    });
    const clauses = calls.map((c) => c.clause).join(' | ');
    expect(clauses).toContain('execution.app_id = :appId');
    expect(clauses).toContain('execution.environment_id = :environmentId');
    expect(clauses).toContain('execution.trigger_type IN (:...triggers)');
    expect(clauses).toContain('execution.created_at >= :from');
    expect(clauses).toContain('execution.created_at <= :to');
  });

  it('applies nothing when no filters are given', () => {
    expect(applyFilters({})).toHaveLength(0);
  });
});

describe('ListExecutionsDto validation', () => {
  const validationProperties = async (input: Record<string, unknown>) => {
    const errors = await validate(plainToInstance(ListExecutionsDto, input));
    return errors.map((error) => error.property);
  };

  it('accepts a recognised status list', async () => {
    const dto = plainToInstance(ListExecutionsDto, { status: ['running', 'success'] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects an unrecognised status value rather than silently dropping the filter', async () => {
    const dto = plainToInstance(ListExecutionsDto, { status: ['bogus'] });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('accepts a recognised trigger value', async () => {
    const dto = plainToInstance(ListExecutionsDto, { trigger: ['schedule'] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects an unrecognised trigger value rather than silently dropping the filter', async () => {
    const dto = plainToInstance(ListExecutionsDto, { trigger: ['bogus'] });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'trigger')).toBe(true);
  });

  it.each([
    ['app_id', 'not-a-uuid'],
    ['folder_id', 'not-a-uuid'],
    ['environment_id', 'not-a-uuid'],
  ])('rejects an invalid %s identifier', async (property, value) => {
    await expect(validationProperties({ [property]: value })).resolves.toContain(property);
  });

  it.each([
    ['from', 'not-a-date'],
    ['to', '2026-99-99'],
  ])('rejects an invalid %s date', async (property, value) => {
    await expect(validationProperties({ [property]: value })).resolves.toContain(property);
  });

  it.each([
    ['page', 0],
    ['page', -1],
    ['page', 1.5],
    ['per_page', 0],
    ['per_page', 101],
    ['per_page', 1.5],
  ])('rejects %s=%p outside the pagination contract', async (property, value) => {
    await expect(validationProperties({ [property]: value })).resolves.toContain(property);
  });

  it.each([
    ['status', ['running', 'bogus']],
    ['trigger', ['manual', 'bogus']],
  ])('rejects a %s list when any member is invalid', async (property, value) => {
    await expect(validationProperties({ [property]: value })).resolves.toContain(property);
  });

  it('keeps the DTO status filters and the repository status keys in sync', () => {
    const repositoryStatusKeys = Object.keys(STATUS_FILTER_TO_PREDICATE).sort();
    expect([...EXECUTION_STATUS_FILTERS].sort()).toEqual(repositoryStatusKeys);
  });
});
