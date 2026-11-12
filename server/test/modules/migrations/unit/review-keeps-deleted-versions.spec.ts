/** @group platform */
import { DropAppVersionReviewVersionForeignKeys1793500000000 as Migration } from '../../../../migrations/1793500000000-DropAppVersionReviewVersionForeignKeys';

// A review is kept, marked invalid, when a version it points at is deleted. With the original foreign keys the
// database got there first: ON DELETE CASCADE dropped a review whose version was deleted, and ON DELETE SET NULL
// cleared the base, which then read as "compare with an empty app".
describe('review foreign keys to versions', () => {
  const run = async (direction: 'up' | 'down') => {
    const queryRunner: any = { query: jest.fn(async () => []) };
    await new Migration()[direction](queryRunner);
    return queryRunner.query.mock.calls.map(([sql]: [string]) => sql.replace(/\s+/g, ' ').trim());
  };

  it('are dropped, so deleting a version touches no review', async () => {
    const sql = await run('up');
    expect(sql.some((s) => /ALTER TABLE app_version_reviews DROP CONSTRAINT IF EXISTS \S*version_id\S*/.test(s))).toBe(
      true
    );
    expect(sql.some((s) => /DROP CONSTRAINT IF EXISTS app_version_reviews_base_version_id_fkey/.test(s))).toBe(true);
    expect(sql.some((s) => /DROP CONSTRAINT IF EXISTS app_version_reviews_version_id_fkey/.test(s))).toBe(true);
  });

  it('delete or change no review row', async () => {
    const sql = await run('up');
    expect(sql.filter((s) => /^(DELETE|UPDATE|TRUNCATE)/i.test(s))).toEqual([]);
  });

  it('come back on the way down, without checking the rows that now point at deleted versions', async () => {
    const sql = await run('down');
    expect(sql.filter((s) => /ADD CONSTRAINT/.test(s))).toHaveLength(2);
    expect(sql.every((s) => !/ADD CONSTRAINT/.test(s) || /NOT VALID/.test(s))).toBe(true);
  });
});
