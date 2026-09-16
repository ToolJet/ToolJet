import { classifyCoverage } from '@helpers/coverage-gate-probe.helper';

/** @group platform */
describe('classifyCoverage', () => {
  it.each([
    [10, 'low'],
    [60, 'ok'],
    [90, 'high'],
  ])('should classify %d%% as %s', (pct, expected) => {
    expect(classifyCoverage(pct)).toBe(expected);
  });
});
