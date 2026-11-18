import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { App } from '@entities/app.entity';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from './constants';
import { FeatureAbility } from './ability';
import { defineAppAbility } from './ability/app.ability';
import { MenuAppDto, MenuAppFolderDto } from './dto/menu-apps';

/**
 * Whether opening the app's released version would pass `validate-released-app-access`.
 * Runs the same rule the guard runs, so the menu never lists an app the viewer is refused.
 */
export function canOpenReleasedApp(permissions: UserAllPermissions, appId: string): boolean {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);
  defineAppAbility(can, permissions, appId);
  return build().can(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS, App);
}

export interface ListedApp {
  id: string;
  name: string;
  slug: string;
  currentVersionId: string | null;
}

export interface AppFolderRow {
  appId: string;
  folderId: string;
  folderName: string;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

/** Released apps only, each with its folder, sorted by name. */
export function toMenuApps(apps: ListedApp[], folderRows: AppFolderRow[]): MenuAppDto[] {
  const folderByApp = new Map<string, MenuAppFolderDto>(
    folderRows.map((row) => [row.appId, { id: row.folderId, name: row.folderName }])
  );

  return apps
    .filter((app) => !!app.currentVersionId && !!app.slug)
    .map((app) => ({ id: app.id, name: app.name, slug: app.slug, folder: folderByApp.get(app.id) ?? null }))
    .sort(byName);
}
