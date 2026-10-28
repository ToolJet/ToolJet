/** @group workflows */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SelectQueryBuilder } from 'typeorm';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { ExecutionListFilters } from '@modules/workflows/types/execution-list';
import {
  WorkflowExecutionRepository,
  STATUS_FILTER_TO_PREDICATE,
} from '@modules/workflows/repositories/workflow-execution.repository';
import { ListExecutionsDto, EXECUTION_STATUS_FILTERS } from '@modules/workflows/dto/list-executions.dto';

// A QueryBuilder test double recording andWhere calls. The status predicates run against Postgres
// in e2e/workflow-executions-list-query.spec.ts.
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

type ApplyListFilters = (query: SelectQueryBuilder<WorkflowExecution>, filters: ExecutionListFilters) => void;

const applyFilters = (filters: ExecutionListFilters) => {
  const qb = makeQueryBuilder();
  const { applyListFilters } = WorkflowExecutionRepository.prototype as unknown as {
    applyListFilters: ApplyListFilters;
  };
  applyListFilters.call({}, qb as unknown as SelectQueryBuilder<WorkflowExecution>, filters);
  return qb.calls;
};

describe('WorkflowExecutionRepository.applyListFilters', () => {
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
