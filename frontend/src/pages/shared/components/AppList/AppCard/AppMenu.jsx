import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppWindow, Copy, FileUp, FolderInput, FolderOutput, PencilRuler, Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/DropdownMenu/DropdownMenu';
import { Button } from '@/components/ui/Button/Button';
import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

export default function AppMenu({
  appType,
  onMenuItemClick,
  appDetails,
  hasUpdatePermission,
  hasCreatePermission,
  hasDeletePermission,
  currentSelectedFolder,
  ownedFolders,
}) {
  const { t } = useTranslation();

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const currentSession = authenticationService.currentSessionValue;
  const currentUserId = currentSession?.current_user?.id;

  // ─── Ownership ────────────────────────────────────────────────────────────────
  const isAppOwner = !!(appDetails.user_id && currentUserId && appDetails.user_id === currentUserId);

  // ─── App-level edit access ────────────────────────────────────────────────────
  // Backend resolves folder-derived permissions into editable_apps_id, so canEditApp
  // already covers apps in folders owned by or explicitly shared with the user.
  const canEditApp =
    currentSession?.app_group_permissions?.is_all_editable ||
    currentSession?.app_group_permissions?.editable_apps_id?.includes(appDetails.id);

  const canModifyApp = canEditApp || isAppOwner;

  const folderGroupPermissions = currentSession?.folder_group_permissions;

  const canEditAnyFolderViaGroup =
    folderGroupPermissions?.is_all_editable || folderGroupPermissions?.editable_folders_id?.length > 0;

  // canAddAppToFolder: user can modify the app AND has at least one folder available in the dropdown.
  const hasOwnedFolders = isAppOwner && Array.isArray(ownedFolders) && ownedFolders.length > 0;

  const canAddAppToFolder =
    canModifyApp &&
    (currentSession?.admin || currentSession?.super_admin || canEditAnyFolderViaGroup || hasOwnedFolders);

  // canRemoveFromFolder: only when inside a specific folder AND user has folder-edit access.
  const canRemoveFromFolder =
    !!currentSelectedFolder?.value &&
    canModifyApp &&
    (currentSession?.admin ||
      currentSession?.super_admin ||
      folderGroupPermissions?.is_all_editable ||
      folderGroupPermissions?.editable_folders_id?.includes(currentSelectedFolder?.value) ||
      currentSelectedFolder?.createdBy === currentUserId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          isLucid
          iconOnly
          size="medium"
          variant="outline"
          leadingIcon="ellipsis-vertical"
          data-cy="app-card-menu-icon"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent className={cn('tw-border-border-weak', { 'dark-theme theme-dark': darkMode })} align="start">
        <DropdownMenuGroup data-cy="card-options">
          {hasUpdatePermission && (
            <>
              <AppMenuItem
                icon={AppWindow}
                label={t('homePage.appCard.renameApp', `Rename ${appType === 'front-end' ? 'app' : appType}`)}
                onItemClick={() => onMenuItemClick('rename', appDetails)}
              />

              <AppMenuItem
                icon={PencilRuler}
                label={t('homePage.appCard.changeIcon', 'Change Icon')}
                onItemClick={() => onMenuItemClick('change-icon', appDetails)}
              />
            </>
          )}

          {canAddAppToFolder && (
            <AppMenuItem
              icon={FolderInput}
              label={t('homePage.appCard.addToFolder', 'Add to folder')}
              onItemClick={() => {
                onMenuItemClick('add-to-folder', appDetails, currentSelectedFolder?.value);

                posthogHelper.captureEvent('click_add_to_folder_option', {
                  workspace_id:
                    authenticationService?.currentUserValue?.organization_id ||
                    authenticationService?.currentSessionValue?.current_organization_id,
                  app_id: appDetails.id,
                });
              }}
            />
          )}

          {canRemoveFromFolder && (
            <AppMenuItem
              icon={FolderOutput}
              label={t('homePage.appCard.removeFromFolder', 'Remove from folder')}
              onItemClick={() => onMenuItemClick('remove-app-from-folder', appDetails, currentSelectedFolder?.value)}
            />
          )}

          {hasUpdatePermission && hasCreatePermission && (
            <>
              {appType !== 'workflow' && (
                <AppMenuItem
                  icon={Copy}
                  label={`Clone ${appType === 'front-end' ? 'app' : appType}`}
                  onItemClick={() => onMenuItemClick('clone', appDetails)}
                />
              )}

              <AppMenuItem
                icon={FileUp}
                label={`Export ${appType === 'front-end' ? 'app' : appType}`}
                onItemClick={() => onMenuItemClick('export', appDetails)}
              />
            </>
          )}

          {hasDeletePermission && (
            <AppMenuItem
              icon={Trash}
              label={
                appType === 'workflow'
                  ? t('homePage.appCard.deleteWorkflow', 'Delete workflow')
                  : appType === 'front-end'
                  ? t('homePage.appCard.deleteApp', 'Delete app')
                  : 'Delete module'
              }
              onItemClick={() => onMenuItemClick('delete', appDetails)}
            />
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppMenuItem({ icon: IconComponent, label, onItemClick }) {
  return (
    <DropdownMenuItem
      onClick={onItemClick}
      className="tw-text-text-default tw-font-body-default"
      data-cy={`${label.toLowerCase().replace(/\s+/g, '-')}-card-option`}
    >
      <IconComponent size={16} color="var(--icon-strong)" />

      {label}
    </DropdownMenuItem>
  );
}
