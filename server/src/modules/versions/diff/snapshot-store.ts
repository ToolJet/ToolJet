import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VersionDiffService } from './version-diff.service';
import { buildSnapshot, VersionRows } from './snapshot';
import { contentFingerprint } from './fingerprint';
import { VersionSnapshot } from './types';

// Stored snapshots keep the raw rows (VersionRows), not the built snapshot, so
// a later change to the diff rules applies to old snapshots too.
const KEEP_PER_VERSION = 30;

export type StoredSnapshot = {
  id: string;
  versionId: string;
  reason: string;
  refId: string | null;
  fingerprint: string;
  createdAt: string;
  rows: VersionRows;
};

export class VersionSnapshotStore {
  private readonly diffs = new VersionDiffService();

  async capture(
    manager: EntityManager,
    input: { organizationId: string; appId: string; versionId: string; reason: string; refId?: string; userId?: string }
  ): Promise<{ id: string; fingerprint: string }> {
    const rows = await this.diffs.loadRows(manager, input.appId, input.versionId);
    const fingerprint = contentFingerprint(buildSnapshot(rows));
    const [{ id }] = await manager.query(
      `INSERT INTO app_version_snapshots (organization_id, app_id, version_id, reason, ref_id, fingerprint, content, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        input.organizationId,
        input.appId,
        input.versionId,
        input.reason,
        input.refId ?? null,
        fingerprint,
        JSON.stringify(rows),
        input.userId ?? null,
      ]
    );
    // Bounded history per version; the newest ones are the ones people open.
    await manager.query(
      `DELETE FROM app_version_snapshots WHERE version_id = $1 AND id NOT IN (
         SELECT id FROM app_version_snapshots WHERE version_id = $1 ORDER BY created_at DESC LIMIT ${KEEP_PER_VERSION})`,
      [input.versionId]
    );
    return { id, fingerprint };
  }

  async load(manager: EntityManager, appId: string, snapshotId: string): Promise<StoredSnapshot> {
    const [row] = await manager.query(
      `SELECT id, version_id AS "versionId", reason, ref_id AS "refId", fingerprint, created_at AS "createdAt", content
         FROM app_version_snapshots WHERE id = $1 AND app_id = $2`,
      [snapshotId, appId]
    );
    if (!row) throw new NotFoundException('Snapshot not found');
    const rows = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return { ...row, rows };
  }

  async snapshot(manager: EntityManager, appId: string, snapshotId: string): Promise<VersionSnapshot> {
    const stored = await this.load(manager, appId, snapshotId);
    // A snapshot is named after the moment, not the version it was taken from.
    return buildSnapshot({
      ...stored.rows,
      version: { ...stored.rows.version, id: stored.id, name: 'Before', status: null },
    });
  }

  async fingerprintOf(manager: EntityManager, appId: string, versionId: string): Promise<string> {
    return contentFingerprint(buildSnapshot(await this.diffs.loadRows(manager, appId, versionId)));
  }
}
