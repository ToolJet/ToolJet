import { resolveBackgroundJobThresholds, DEFAULT_BACKGROUND_JOB_THRESHOLDS } from '@ee/background-jobs/thresholds';

describe('resolveBackgroundJobThresholds', () => {
  it('returns the defaults when no env overrides are set', () => {
    expect(resolveBackgroundJobThresholds({})).toEqual({
      branch: { apps: 10, modules: 30, dataSources: 100 },
      version: { entities: 500 },
    });
    expect(DEFAULT_BACKGROUND_JOB_THRESHOLDS.version.entities).toBe(500);
  });

  it('applies valid positive-integer overrides', () => {
    const t = resolveBackgroundJobThresholds({
      TOOLJET_BG_BRANCH_MAX_APPS: '3',
      TOOLJET_BG_BRANCH_MAX_MODULES: '4',
      TOOLJET_BG_BRANCH_MAX_DATA_SOURCES: '5',
      TOOLJET_BG_VERSION_MAX_ENTITIES: '200',
    });
    expect(t).toEqual({ branch: { apps: 3, modules: 4, dataSources: 5 }, version: { entities: 200 } });
  });

  it.each(['0', '-1', 'abc', '1.5', ''])('ignores invalid override %p, warns, and keeps the default', (bad) => {
    const warn = jest.fn();
    const t = resolveBackgroundJobThresholds({ TOOLJET_BG_VERSION_MAX_ENTITIES: bad }, warn);
    expect(t.version.entities).toBe(500);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('TOOLJET_BG_VERSION_MAX_ENTITIES'));
  });
});
