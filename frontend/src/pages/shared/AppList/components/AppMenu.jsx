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
} from '@/components/ui/Rocket/dropdown-menu';
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
  currentFolderId,
}) {
  const { t } = useTranslation();

  const darkMode = localStorage.getItem('darkMode') === 'true';

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

          {hasCreatePermission && appType !== 'module' && (
            <>
              <AppMenuItem
                icon={FolderInput}
                label={t('homePage.appCard.addToFolder', 'Add to folder')}
                onItemClick={() => {
                  onMenuItemClick('add-to-folder', appDetails);

                  posthogHelper.captureEvent('click_add_to_folder_option', {
                    workspace_id:
                      authenticationService?.currentUserValue?.organization_id ||
                      authenticationService?.currentSessionValue?.current_organization_id,
                    app_id: appDetails.id,
                  });
                }}
              />

              {currentFolderId && (
                <AppMenuItem
                  icon={FolderOutput}
                  label={t('homePage.appCard.removeFromFolder', 'Remove from folder')}
                  onItemClick={() => onMenuItemClick('remove-app-from-folder', appDetails, currentFolderId)}
                />
              )}
            </>
          )}

          {hasUpdatePermission && hasCreatePermission && (
            <>
              {appType !== 'workflow' && (
                <AppMenuItem
                  icon={Copy}
                  label={`Clone ${appType === 'front-end' ? 'app' : appType}`}
                  onItemClick={() => onMenuItemClick('clone', appDetails)}
                  disabled
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

function AppMenuItem({ icon: IconComponent, label, onItemClick, disabled }) {
  return (
    <DropdownMenuItem
      onClick={onItemClick}
      className="tw-text-text-default tw-font-body-default"
      data-cy={`${label.toLowerCase().replace(/\s+/g, '-')}-card-option`}
      disabled={disabled}
    >
      <IconComponent size={16} color="var(--icon-weak)" />

      {label}
    </DropdownMenuItem>
  );
}
