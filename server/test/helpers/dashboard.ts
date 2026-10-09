import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { PinnedItem } from '@entities/pinned_item.entity';
import { User } from '@entities/user.entity';
import { UserAppActivity } from '@entities/user_app_activity.entity';
import { createApplication, createApplicationVersion, resolveOrSeedDefaultBranch } from './seed';
import { saveEntity, updateEntity } from './utils';

/** App + one version on `branchId` (default branch when omitted), optionally released and foldered. */
export async function seedDashboardApp(
  nestApp: INestApplication,
  opts: { user: User; name: string; type?: string; released?: boolean; folder?: Folder; branchId?: string }
): Promise<{ app: App; version: AppVersion }> {
  const app = await createApplication(nestApp, { name: opts.name, user: opts.user, type: opts.type });
  const version = await createApplicationVersion(nestApp, app as App & { organizationId: string });
  const branchId = opts.branchId ?? (await resolveOrSeedDefaultBranch(opts.user.organizationId)).id;
  if (opts.branchId) await updateEntity(AppVersion, version.id, { branchId });
  if (opts.released) await updateEntity(App, app.id, { currentVersionId: version.id });
  if (opts.folder) await saveEntity(FolderApp, { folderId: opts.folder.id, appId: app.id, branchId } as FolderApp);
  return { app, version };
}

export async function seedPin(
  user: User,
  opts: { appId?: string; folderId?: string; branchId: string; position: number }
): Promise<PinnedItem> {
  return saveEntity(PinnedItem, {
    userId: user.id,
    branchId: opts.branchId,
    appId: opts.appId ?? null,
    folderId: opts.folderId ?? null,
    position: opts.position,
  } as PinnedItem);
}

export async function seedActivity(
  userId: string,
  appId: string,
  branchId: string,
  at: { lastViewedAt?: Date; lastEditedAt?: Date }
): Promise<UserAppActivity> {
  return saveEntity(UserAppActivity, {
    userId,
    appId,
    branchId,
    lastViewedAt: at.lastViewedAt ?? null,
    lastEditedAt: at.lastEditedAt ?? null,
  } as UserAppActivity);
}
