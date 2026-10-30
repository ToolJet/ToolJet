import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RunDataQueryDto } from '@modules/data-queries/dto';
import { runExecutionOptions } from '@modules/data-queries/service';

/** @group platform */
describe('run request cache control', () => {
  const validate = (body: object) => validateSync(plainToInstance(RunDataQueryDto, body), { whitelist: true });

  it('accepts no instruction or refresh, and rejects anything else', () => {
    expect(validate({ resolvedOptions: {} })).toHaveLength(0);
    expect(validate({ cacheControl: 'refresh' })).toHaveLength(0);
    expect(validate({ cacheControl: 'clear' })).toHaveLength(1);
  });

  it('maps refresh to clear-all-then-refresh and everything else to a normal run', () => {
    expect(runExecutionOptions({ cacheControl: 'refresh' })).toEqual({
      responseCache: { refresh: true, clearAll: true },
    });
    expect(runExecutionOptions({})).toBeUndefined();
    expect(runExecutionOptions(undefined)).toBeUndefined();
  });
});
