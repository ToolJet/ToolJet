import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectSeparator,
} from '@/components/ui/Rocket/select';
import { Button } from '@/components/ui/Button/Button';
import { getAvatar, decodeEntities } from '@/_helpers/utils';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import { appendWorkspaceId, getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import { useFetchOrganizations, useFetchWorkspacesLimit } from '../../shared/hooks/organizationServiceHooks';
import { CreateOrganization } from '@/modules/common/components/OrganizationManager';

export default function WorkspaceSelector({ totalCount = 8 }) {
  const edition = fetchEdition();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const {
    current_organization_id: selectedWorkspaceId,
    admin: isAdmin,
    super_admin: isSuperAdmin,
  } = authenticationService.currentSessionValue;

  const [openCreateWorkspaceDialog, setOpenCreateWorkspaceDialog] = useState(false);

  const { data: workspaceList = [] } = useFetchOrganizations();
  const { data: workspacesLimit } = useFetchWorkspacesLimit();

  const newTab = false;

  const handleChangeWorkspace = (newWorkspaceId) => {
    console.log('newWorkspaceId', newWorkspaceId);

    const newWorkspaceDetails = workspaceList.find((workspace) => workspace.id === newWorkspaceId);

    if ([newWorkspaceId, newWorkspaceDetails.slug].includes(getWorkspaceIdOrSlugFromURL())) return;

    const newPath = appendWorkspaceId(newWorkspaceDetails.slug || newWorkspaceId, location.pathname, true);

    newTab ? window.open(newPath, '_blank') : (window.location = newPath);
  };

  const handleAddNewWorkspace = () => {
    if (workspacesLimit && !workspacesLimit.canAddUnlimited && workspacesLimit?.percentage >= 100) return;

    setOpenCreateWorkspaceDialog(true);
  };

  return (
    <>
      <Select value={selectedWorkspaceId} onValueChange={handleChangeWorkspace}>
        <SelectTrigger
          showIcon
          className="tw-rounded-md tw-max-w-40 tw-shadow-none tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-border-0 hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected"
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent className={cn('tw-min-w-60', { 'dark-theme theme-dark': darkMode })}>
          <h6 className="tw-font-title-default tw-text-text-default tw-p-2">Workspaces ({workspaceList?.length})</h6>

          <SelectSeparator className="tw-border-border-weak" />

          <SelectGroup>
            {workspaceList.map((workspace) => (
              <WorkspaceListItem
                key={workspace.id}
                workspace={workspace}
                isAdmin={isAdmin}
                isCloudEdition={edition === 'cloud'}
                isSelected={workspace.id === selectedWorkspaceId}
              />
            ))}
          </SelectGroup>

          <SelectSeparator className="tw-border-border-weak" />

          <Button isLucid variant="ghost" leadingIcon="plus" className="tw-w-full" onClick={handleAddNewWorkspace}>
            Add new workspace
          </Button>
        </SelectContent>
      </Select>

      <CreateOrganization showCreateOrg={openCreateWorkspaceDialog} setShowCreateOrg={setOpenCreateWorkspaceDialog} />
    </>
  );
}

function WorkspaceListItem({ workspace, isAdmin, isCloudEdition, isSelected }) {
  return (
    <SelectItem value={workspace.id} className="tw-gap-1">
      <span
        data-cy={`${String(workspace.name).toLowerCase().replace(/\s+/g, '-')}-avatar`}
        className="tw-font-body-small tw-text-text-placeholder tw-uppercase tw-bg-interactive-hover tw-rounded tw-min-w-5 tw-px-0.5 tw-text-center !tw-leading-5"
      >
        {getAvatar(workspace.name)}
      </span>

      <SelectItemText asChild>
        <span className="tw-font-body-default">{decodeEntities(workspace.name)}</span>
      </SelectItemText>

      {/* {isSelected && isAdmin && (
        <Button isLucid iconOnly size="small" variant="ghost" leadingIcon="square-pen" onClick={() => null} />
      )}

      {!isSelected && (
        <Button
          isLucid
          iconOnly
          size="small"
          variant="ghost"
          leadingIcon="square-arrow-out-up-right"
          onPointerUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(appendWorkspaceId(workspace.slug || workspace.id, window.location.pathname, true), '_blank');
          }}
        />
      )}

      {isCloudEdition &&
        workspace.license_type &&
        workspace.license_type?.license_type !== 'basic' &&
        !workspace.license_type?.is_expired && (
          <span className="tw-bg-background-accent-weak tw-text-text-accent tw-font-title-small tw-capitalize tw-rounded-full tw-px-1.5">
            {workspace.plan ? workspace.plan : workspace.license_type?.license_type}
          </span>
        )} */}
    </SelectItem>
  );
}
