import React from 'react';
import { Check } from 'lucide-react';

import { decodeEntities } from '@/_helpers/utils';
import type { IOrganization } from '@/_stores/types/currentSessionStore';
import { authenticationService } from '@/_services/authentication.service';
import { useCurrentSessionStore } from '@/_stores/currentSessionStore';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/Rocket/shadcn/drawer';
import { useSwitchOrganization } from '@/modules/common/components/BaseOrganizationList/useSwitchOrganization';
import { handleLogout } from '@/modules/common/components/ProfileMenu/handleLogout';
import Avatar from '@/modules/dashboard/components/OrganizationList/WorkspaceSelectorV2/Avatar';
import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EELicenseBadge from '@ee/modules/Dashboard/components/OrganizationList/LicenseBadge';

// Shows the plan chip on cloud and enterprise; renders nothing on community.
const LicenseBadge = pickEditionSpecificComponent<{ workspaceDetails: IOrganization }>({
  ee: EELicenseBadge,
  cloudSameAsEE: true,
});

interface WorkspaceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Figma 1890-157236.
export function WorkspaceDrawer({ open, onOpenChange }: WorkspaceDrawerProps) {
  const organizations = useCurrentSessionStore((state) => state.organizations) as IOrganization[];
  const { current_organization_id: currentId, current_user: user } = authenticationService.currentSessionValue;
  const switchWorkspace = useSwitchOrganization();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <div className="tw-flex tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 tw-py-5">
          <DrawerTitle className="tw-m-0 tw-font-title-large tw-text-text-default">Workspaces</DrawerTitle>
          <span className="tw-rounded-full tw-bg-interactive-default tw-px-2 tw-font-body-default tw-text-text-placeholder">
            {organizations.length}
          </span>
        </div>

        <ul className="tw-m-0 tw-min-h-0 tw-max-h-96 tw-flex-1 tw-list-none tw-overflow-y-auto tw-hide-scrollbar tw-p-0">
          {organizations.map((workspace) => (
            <li key={workspace.id}>
              <button
                type="button"
                aria-current={workspace.id === currentId}
                className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-4 tw-border-0 tw-bg-transparent tw-p-4 tw-text-left"
                onClick={() => switchWorkspace(workspace)}
              >
                <Avatar
                  workspaceName={workspace.name}
                  classes={{
                    avatarContainer: 'tw-size-12 tw-shrink-0 tw-rounded-md',
                    avatarText: 'tw-font-title-x-large',
                  }}
                />
                <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-body-x-large tw-text-text-default">
                  {decodeEntities(workspace.name)}
                </span>
                <LicenseBadge workspaceDetails={workspace} />
                {workspace.id === currentId && (
                  <Check aria-hidden className="tw-size-5 tw-shrink-0 tw-text-icon-brand" />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-4 tw-py-4">
          <div className="tw-min-w-0">
            <p className="tw-m-0 tw-truncate tw-font-title-x-large tw-text-text-default">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="tw-m-0 tw-truncate tw-font-body-large tw-text-text-default">{user?.email}</p>
          </div>
          <button
            type="button"
            className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-2 tw-font-title-x-large tw-text-text-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
