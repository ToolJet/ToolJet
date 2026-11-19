import { renderHook, waitFor } from '@testing-library/react';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useCastReport } from '../useCastReport';

const base = {
  columnName: 'owner',
  tableId: 'table-1',
  organizationId: 'org-1',
  environmentId: 'env-1',
};

const countOf = (count: unknown) => ({ data: { result: { data: [{ count }] } } });

describe('useCastReport', () => {
  let sqlExecution: jest.SpyInstance;

  beforeEach(() => {
    sqlExecution = jest.spyOn(tooljetDatabaseService, 'sqlExecution').mockResolvedValue(countOf('0'));
  });
  afterEach(() => jest.restoreAllMocks());

  it('has nothing to report while the type is not changing, or the cast cannot fail', () => {
    expect(
      renderHook(() => useCastReport({ ...base, savedType: 'character varying', targetType: 'character varying' }))
        .result.current
    ).toBeNull();
    expect(
      renderHook(() => useCastReport({ ...base, savedType: 'integer', targetType: 'bigint' })).result.current
    ).toBeNull();
    expect(
      renderHook(() => useCastReport({ ...base, savedType: 'integer', targetType: 'character varying' })).result.current
    ).toBeNull();
    expect(sqlExecution).not.toHaveBeenCalled();
  });

  it('counts the values that will not convert, in this environment', async () => {
    sqlExecution.mockResolvedValue(countOf('3'));
    const { result } = renderHook(() =>
      useCastReport({ ...base, savedType: 'character varying', targetType: 'integer' })
    );
    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current?.status).toBe('done'));
    expect(result.current).toMatchObject({ status: 'done', count: 3, columnName: 'owner', probe: { kind: 'regex' } });
    expect(sqlExecution).toHaveBeenCalledWith('org-1', 'table-1', {
      sql: expect.stringContaining('"owner"'),
      environment_id: 'env-1',
    });
  });

  it('says so when the values cannot be checked in advance', () => {
    const { result } = renderHook(() =>
      useCastReport({ ...base, savedType: 'character varying', targetType: 'jsonb' })
    );
    expect(result.current).toEqual({ status: 'uncheckable' });
    expect(sqlExecution).not.toHaveBeenCalled();
  });

  it('reports a failed check as an error, never as a clean column', async () => {
    sqlExecution.mockResolvedValue({ data: { result: { status: 'failed', error_message: 'boom' } } });
    const { result } = renderHook(() =>
      useCastReport({ ...base, savedType: 'character varying', targetType: 'integer' })
    );
    await waitFor(() => expect(result.current?.status).toBe('error'));
    expect(result.current).toMatchObject({ message: 'boom' });
  });

  it('reports a count that is not a number as an error', async () => {
    sqlExecution.mockResolvedValue(countOf(undefined));
    const { result } = renderHook(() =>
      useCastReport({ ...base, savedType: 'character varying', targetType: 'integer' })
    );
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'error', message: 'Could not check existing values' })
    );
  });

  it('waits for an environment before it asks', () => {
    const { result } = renderHook(() =>
      useCastReport({ ...base, environmentId: undefined, savedType: 'character varying', targetType: 'integer' })
    );
    expect(result.current).toBeNull();
    expect(sqlExecution).not.toHaveBeenCalled();
  });

  it('forgets the report when the type goes back', async () => {
    const { result, rerender } = renderHook(
      ({ targetType }) => useCastReport({ ...base, savedType: 'character varying', targetType }),
      { initialProps: { targetType: 'integer' } }
    );
    await waitFor(() => expect(result.current?.status).toBe('done'));
    rerender({ targetType: 'character varying' });
    expect(result.current).toBeNull();
  });
});
