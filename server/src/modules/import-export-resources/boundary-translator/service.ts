import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FkReferenceMap } from './fk-reference-map';

/**
 * Untyped tree shape. Today's export/import already passes plain objects
 * around; promoting these to nominal types is out of scope for this phase.
 */
export type EntityTree = Record<string, unknown>;
export type PortableSnapshot = Record<string, unknown>;

/**
 * Single boundary between local DB ids and portable co_relation_ids.
 *
 * Every flow that crosses an instance boundary — git push, git pull, JSON
 * export, JSON import, branch-create — calls this translator instead of
 * holding its own rewrite map. That's what guarantees the §0 invariant:
 * a manual JSON export/import on instance B produces the same DB state as
 * a git push/pull from A to B.
 */
@Injectable()
export class BoundaryTranslator {
  constructor(private readonly fkMap: FkReferenceMap) {}

  /**
   * DB → wire. Walks the entity tree, replaces every local-id reference
   * with its co_relation_id. Output is safe to persist outside this
   * instance (file tree, JSON download, network payload).
   */
  async toPortable(_tree: EntityTree, _manager: EntityManager): Promise<PortableSnapshot> {
    throw new Error('BoundaryTranslator.toPortable not implemented yet');
  }

  /**
   * Wire → DB. Walks the portable snapshot in dependency order, looks up
   * the local row for each co_relation_id (reusing existing local ids when
   * matched, generating new ones when not), and rewrites every reference
   * to the resolved local id before insert/update.
   */
  async toLocal(_snapshot: PortableSnapshot, _manager: EntityManager): Promise<EntityTree> {
    throw new Error('BoundaryTranslator.toLocal not implemented yet');
  }
}
