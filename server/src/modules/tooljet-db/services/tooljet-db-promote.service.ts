import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';

export type PromoteResult = {
  promoted_to: string;
  environment_id: string;
  relation_id: string;
  applied_migrations: number;
};

/**
 * The migrations `source` has confirmed that `target` has not, ordered by `(sequence, id)`.
 *
 * "Confirmed" is `applied_at IS NOT NULL` on the application row — never a high-water mark. The set
 * difference is done in SQL: an inner join to the source's applied rows, an anti-join to the
 * target's. A `target` with zero confirmed applications (a fresh relation, or one left behind by a
 * crash mid-promote) therefore yields the entire chain, which is exactly what replaying into it
 * expects.
 *
 * Exported as a free function, not a method: promote-preview (a later change) needs it without
 * pulling in the whole promote service, and it is a pure query with no service state.
 */
export async function computeMissingMigrations(
  internalTableId: string,
  sourceRelation: InternalTableRelation,
  targetRelation: InternalTableRelation,
  manager: EntityManager
): Promise<InternalTableMigration[]> {
  return manager
    .createQueryBuilder(InternalTableMigration, 'm')
    .innerJoin(
      InternalTableMigrationApplication,
      'src',
      'src.migration_id = m.id AND src.relation_id = :sourceRelationId AND src.applied_at IS NOT NULL',
      { sourceRelationId: sourceRelation.id }
    )
    .leftJoin(
      InternalTableMigrationApplication,
      'tgt',
      'tgt.migration_id = m.id AND tgt.relation_id = :targetRelationId AND tgt.applied_at IS NOT NULL',
      { targetRelationId: targetRelation.id }
    )
    .where('m.internal_table_id = :internalTableId', { internalTableId })
    .andWhere('tgt.migration_id IS NULL')
    .orderBy('m.sequence', 'ASC')
    .addOrderBy('m.id', 'ASC')
    .getMany();
}

/**
 * CE stub. Promote is a multi-environment feature — the real per-table replay lives in the EE
 * subclass. Standing stub-and-extend rule: CE answers the licence question with a 403.
 */
@Injectable()
export class TooljetDbPromoteService {
  async promote(
    _user: { id: string; organizationId: string },
    _organizationId: string,
    _tableId: string,
    _sourceEnvironmentId: string
  ): Promise<PromoteResult> {
    throw new ForbiddenException(
      'Promoting a ToolJet Database table to another environment requires a ToolJet Enterprise licence.'
    );
  }
}
