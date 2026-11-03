import { ConflictException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

/**
 * A Release dialog says which version the release replaces. Left open while someone else released a newer version,
 * its confirmation put the older version back live with no warning (codex two-user audit, 2026-10-26). The client
 * sends the released version it showed (`''` for none); a different live version refuses the release, and the client
 * reads the app again to show what it would really replace. The app row is locked for the rest of the
 * release, so two releases at once queue rather than both passing. Clients that send nothing are not checked.
 */
export async function assertReleaseBaseline(
  manager: EntityManager,
  appId: string,
  expectedReleasedVersionId: string | null | undefined
): Promise<void> {
  if (expectedReleasedVersionId === undefined) return;
  const [row] = await manager.query(`SELECT current_version_id AS "currentVersionId" FROM apps WHERE id = $1 FOR UPDATE`, [
    appId,
  ]);
  const live = row?.currentVersionId ?? null;
  if (live !== (expectedReleasedVersionId || null)) {
    throw new ConflictException(
      'Another version was released after you opened this. Review what your release replaces now.'
    );
  }
}
