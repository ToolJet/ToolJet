import { computeMigrationSync } from '@modules/tooljet-db/helpers/migration-sync';

const sets = (...ids: string[][]) => ids.map((list) => new Set(list));

describe('computeMigrationSync', () => {
  // Environments are passed in priority order: development, staging, production.
  it('should report nothing when every environment has the same migrations', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m1', 'm2'], ['m1', 'm2']))).toBeNull();
  });

  it('should report pending in development when development has a migration staging lacks', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m1'], ['m1']))).toBe('pending_in_development');
  });

  it('should report pending in staging when production lacks a migration that development and staging both have', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m1', 'm2'], ['m1']))).toBe('pending_in_staging');
  });

  it('should report pending in development when staging lacks migrations, whatever production has', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], [], ['m1', 'm2']))).toBe('pending_in_development');
  });

  it('should report pending in staging when development and staging match and production is behind', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m1', 'm2'], []))).toBe('pending_in_staging');
  });

  it('should prefer pending in development when development is ahead of staging and staging ahead of production', () => {
    expect(computeMigrationSync(sets(['m1', 'm2', 'm3'], ['m1', 'm2'], ['m1']))).toBe('pending_in_development');
  });

  it('should compare sets, not counts: same size, different members', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m2', 'm3'], ['m2', 'm3']))).toBe('pending_in_development');
  });

  it('should treat an environment with no copy of the table as having applied nothing', () => {
    expect(computeMigrationSync(sets(['m1'], [], []))).toBe('pending_in_development');
  });

  it('should report nothing for a table with no migrations anywhere', () => {
    expect(computeMigrationSync(sets([], [], []))).toBeNull();
  });

  it('should report nothing when there is only one environment to compare', () => {
    expect(computeMigrationSync(sets(['m1', 'm2']))).toBeNull();
    expect(computeMigrationSync([])).toBeNull();
  });

  it('should compare development against production when staging is not licensed', () => {
    expect(computeMigrationSync(sets(['m1', 'm2'], ['m1']))).toBe('pending_in_development');
    expect(computeMigrationSync(sets(['m1'], ['m1']))).toBeNull();
  });

  it('should ignore a migration only production has: nothing is pending to apply', () => {
    expect(computeMigrationSync(sets(['m1'], ['m1'], ['m1', 'm9']))).toBeNull();
  });
});
