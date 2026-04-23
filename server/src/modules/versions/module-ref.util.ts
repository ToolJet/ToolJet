import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

/**
 * A module consumer stores a free-form string in `properties.moduleVersionId`.
 * The string does not declare whether it's a pin or a branch marker — the
 * meaning is inferred at read time. This module codifies that inference as a
 * three-way taxonomy so the resolver can't silently conflate the cases:
 *
 *   pinned    → explicit reference to a saved version
 *   unpinned  → follow whichever module content lives on the viewer's branch
 *   stale     → neither; the producing branch/version is gone
 */
export type ModuleRef =
  | { kind: 'pinned'; versionName: string; canonicalVersion: AppVersion }
  | { kind: 'unpinned'; branchName: string }
  | { kind: 'stale'; rawValue: string };

/**
 * Classify a raw `moduleVersionId` string. Checks for a pinned version first so
 * a version whose name collides with a branch name (e.g. someone named a version
 * "main") still resolves to the pin. Falls through to branch-name match, then
 * to stale.
 */
export async function classifyModuleRef(
  manager: EntityManager,
  moduleApp: App,
  rawValue: string,
  organizationId: string
): Promise<ModuleRef> {
  const defaultBranch = await manager.findOne(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
  });

  if (defaultBranch) {
    const canonicalVersion = await manager.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        name: rawValue,
        branchId: defaultBranch.id,
        versionType: AppVersionType.VERSION,
        isStub: false,
      },
    });
    if (canonicalVersion) {
      return { kind: 'pinned', versionName: rawValue, canonicalVersion };
    }
  }

  const branch = await manager.findOne(WorkspaceBranch, {
    where: { organizationId, name: rawValue },
  });
  if (branch) {
    return { kind: 'unpinned', branchName: rawValue };
  }

  return { kind: 'stale', rawValue };
}

/**
 * Resolve a classified ref to a concrete AppVersion given the consumer's branch.
 *
 *   pinned   → prefer a pulled copy on the consumer's branch, else the canonical
 *              version on the default branch. Never drifts to "latest".
 *   unpinned → latest non-stub version for this module on the consumer's branch
 *              (falls back to the default branch when no branchId is supplied,
 *              e.g. embedded viewers / public access).
 *   stale    → latest saved version on the default branch, so orphaned refs
 *              render something reasonable instead of 404-ing.
 */
export async function resolveModuleRef(
  manager: EntityManager,
  moduleApp: App,
  ref: ModuleRef,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  switch (ref.kind) {
    case 'pinned': {
      if (consumerBranchId) {
        const localCopy = await manager.findOne(AppVersion, {
          where: {
            appId: moduleApp.id,
            name: ref.versionName,
            branchId: consumerBranchId,
            isStub: false,
          },
        });
        if (localCopy) return localCopy;
      }
      return ref.canonicalVersion;
    }

    case 'unpinned': {
      const targetBranchId =
        consumerBranchId ??
        (await manager.findOne(WorkspaceBranch, { where: { organizationId, isDefault: true } }))?.id;
      if (!targetBranchId) return null;
      return manager.findOne(AppVersion, {
        where: { appId: moduleApp.id, branchId: targetBranchId, isStub: false },
        order: { createdAt: 'DESC' },
      });
    }

    case 'stale': {
      const defaultBranch = await manager.findOne(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
      });
      if (!defaultBranch) return null;
      return manager.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          branchId: defaultBranch.id,
          versionType: AppVersionType.VERSION,
          isStub: false,
        },
        order: { createdAt: 'DESC' },
      });
    }
  }
}
