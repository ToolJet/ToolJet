/**
 * Covers: migration-helpers/component-key-moves.ts. The SQL itself runs against Postgres in
 * e2e/appbuilder-key-move.spec.ts; this checks how the cleanup splits it into transactions.
 * @group database
 */
import { QueryRunner } from 'typeorm';
import { ComponentKeyMove, contractMovedKeys, createKeyMoveSync } from 'src/migration-helpers/component-key-moves';

const MOVES: ComponentKeyMove[] = [
  { types: ['SvgImage'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
];

/** Records each transaction's statements. Id lookups run outside a transaction: one batch, then none. */
function recordingQueryRunner() {
  const transactions: string[][] = [];
  const batches = [[{ id: 'a' }, { id: 'b' }]];
  let current: string[] | undefined;
  const queryRunner = {
    get isTransactionActive() {
      return current !== undefined;
    },
    startTransaction: async () => {
      current = [];
    },
    commitTransaction: async () => {
      transactions.push(current ?? []);
      current = undefined;
    },
    rollbackTransaction: async () => {
      current = undefined;
    },
    query: async (sql: string) => {
      if (!current) return batches.shift() ?? [];
      if (!sql.startsWith('SET LOCAL')) current.push(sql);
      return [];
    },
  } as unknown as QueryRunner;
  return { queryRunner, transactions };
}

describe('migration-helpers/component-key-moves', () => {
  it('should drop the sync trigger in its own short transaction, so removing old keys never waits under its lock', async () => {
    const { queryRunner, transactions } = recordingQueryRunner();

    await contractMovedKeys(queryRunner, 'svg_image', MOVES);

    expect(transactions).toEqual([
      ['DROP TRIGGER IF EXISTS trg_components_sync_svg_image ON components'],
      [
        expect.stringMatching(/^UPDATE components SET properties = .* WHERE id = ANY\('\{a,b\}'::uuid\[\]\) AND/s),
        expect.stringMatching(/^UPDATE components SET styles = CASE WHEN .* - array_remove\(/s),
      ],
    ]);
  });

  it('should reject a sync name that cannot be part of a trigger name', async () => {
    const { queryRunner } = recordingQueryRunner();

    await expect(createKeyMoveSync(queryRunner, 'Svg-Image', MOVES)).rejects.toThrow('must be snake_case');
  });
});
