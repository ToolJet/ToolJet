/**
 * deleteAppHistoryForStructuralMigration Unit Tests
 *
 * Structural data migrations call this helper to invalidate app history.
 * Deleting rows one by one is quadratic on large instances (the self-referential
 * parent_id FK is unindexed, so every deleted row triggers a full-table scan),
 * which timed out upgrades. The helper now truncates the table whenever the
 * migration changed anything.
 *
 * @group platform
 */
import { EntityManager } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

describe('deleteAppHistoryForStructuralMigration', () => {
  let query: jest.Mock;
  let entityManager: EntityManager;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    entityManager = { query } as unknown as EntityManager;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should truncate app_history in a single statement when app versions were changed', async () => {
    await deleteAppHistoryForStructuralMigration(entityManager, { appVersionIds: ['v1', 'v2'] }, 'Test');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith('TRUNCATE TABLE app_history');
  });

  it('should truncate app_history without resolving versions when components were changed', async () => {
    await deleteAppHistoryForStructuralMigration(entityManager, { componentIds: ['c1'] }, 'Test');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith('TRUNCATE TABLE app_history');
  });

  it('should leave app_history untouched when the migration changed nothing', async () => {
    await deleteAppHistoryForStructuralMigration(entityManager, { appVersionIds: [] }, 'Test');
    await deleteAppHistoryForStructuralMigration(entityManager, { componentIds: [] }, 'Test');
    await deleteAppHistoryForStructuralMigration(entityManager, {}, 'Test');

    expect(query).not.toHaveBeenCalled();
  });

  it('should rethrow when the truncate fails so the migration rolls back', async () => {
    query.mockRejectedValue(new Error('lock timeout'));

    await expect(
      deleteAppHistoryForStructuralMigration(entityManager, { appVersionIds: ['v1'] }, 'Test')
    ).rejects.toThrow('lock timeout');
  });
});
