import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';

import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxSeparator,
} from '@/components/ui/Rocket/Combobox/Combobox';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { decodeEntities } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import TooltipComp from '@/components/ui/Rocket/Tooltip';
import LicenseBadge from '@ee/modules/Dashboard/components/OrganizationList/LicenseBadge';
import ManageWorkspacesBtn from '@ee/modules/Dashboard/components/OrganizationList/ManageWorkspaceBtn';

import Avatar from './Avatar';
import CreateWorkspaceBtn from './CreateWorkspaceBtn';

export default function WorkspaceSelectorV2({
  workspaceList,
  onSwitchWorkspace,
  onCreateNewWorkspace,
  onEditWorkspace,
  // ee specific props
  workspacesLimit = null,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [searchTerm, setSearchTerm] = useState('');
  const [openWorkspaceDropdown, setOpenWorkspaceDropdown] = useState(false);

  const { current_organization_id: selectedWorkspaceId, admin: isAdmin } = authenticationService.currentSessionValue;

  const currentWorkspaceDetails = workspaceList?.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;

  const handleOpenChange = (open) => {
    setOpenWorkspaceDropdown(open);
    // Base UI may write the selected label into the input on select/close; always start a session unfiltered.
    setSearchTerm('');
  };

  const handleValueChange = (workspace) => {
    if (workspace && workspace.id !== selectedWorkspaceId) onSwitchWorkspace(workspace.id);
  };

  const handleClose = () => setOpenWorkspaceDropdown(false);

  const handleAddNewWorkspace = () => {
    onCreateNewWorkspace();
    setOpenWorkspaceDropdown(false);
  };

  const handleEditWorkspaceDetails = () => {
    onEditWorkspace();
    setOpenWorkspaceDropdown(false);
  };

  return (
    <>
      <Combobox
        items={workspaceList ?? []}
        value={currentWorkspaceDetails}
        onValueChange={handleValueChange}
        itemToStringLabel={(workspace) => workspace.name}
        isItemEqualToValue={(item, value) => item.id === value.id}
        open={openWorkspaceDropdown}
        onOpenChange={handleOpenChange}
        inputValue={searchTerm}
        onInputValueChange={setSearchTerm}
      >
        <ComboboxTrigger
          aria-label="Workspace selector"
          data-cy="workspace-selector-trigger"
          className="tw-flex tw-h-8 tw-w-full tw-max-w-40 tw-items-center tw-justify-between tw-gap-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-shadow-none hover:tw-bg-interactive-hover data-[popup-open]:tw-bg-interactive-selected"
        >
          <p data-cy="workspace-name" className="tw-truncate tw-font-title-default tw-mb-0 tw-min-w-0">
            {decodeEntities(currentWorkspaceDetails?.name ?? '')}
          </p>
        </ComboboxTrigger>

        <ComboboxContent
          anchor={false}
          align="start"
          className={cn('tw-w-60 tw-p-1 tw-border tw-border-solid tw-border-border-weak', {
            'dark-theme theme-dark': darkMode,
          })}
        >
          <header className="tw-px-2 py-1">
            {Boolean(currentWorkspaceDetails) && (
              <div className="tw-space-y-1.5">
                <div className="tw-flex tw-justify-between tw-items-center gap-1">
                  <Avatar workspaceName={currentWorkspaceDetails.name} classes={{ avatarContainer: 'tw-size-8' }} />

                  <div className="tw-flex tw-items-center has-[+*]:tw-self-end">
                    {isAdmin && (
                      <TooltipComp arrow content="Edit workspace details">
                        <Button
                          isLucid
                          iconOnly
                          size="medium"
                          variant="ghost"
                          leadingIcon="square-pen"
                          data-cy="edit-workspace-button"
                          onClick={handleEditWorkspaceDetails}
                        />
                      </TooltipComp>
                    )}

                    <ManageWorkspacesBtn handleClose={handleClose} />
                  </div>
                </div>

                <TruncatedText
                  arrow
                  content={decodeEntities(currentWorkspaceDetails.name ?? '')}
                  className="tw-inline-block tw-text-text-default tw-font-title-large tw-truncate tw-w-full"
                >
                  {decodeEntities(currentWorkspaceDetails.name ?? '')}
                </TruncatedText>

                <LicenseBadge workspaceDetails={currentWorkspaceDetails} />
              </div>
            )}
          </header>

          <ComboboxSeparator className="tw-my-1" />

          {/* Search box */}
          <div className="tw-relative tw-w-full tw-mb-2">
            <Search
              size={16}
              className="tw-absolute tw-left-2 tw-top-1/2 -tw-translate-y-1/2 tw-text-icon-default tw-pointer-events-none"
            />

            <ComboboxPrimitive.Input
              render={
                <Input type="text" data-cy="search-workspace" className="tw-pl-7 tw-pr-2 focus-visible:tw-ring-inset" />
              }
              placeholder="Search workspace"
            />
          </div>

          <ComboboxList className="tw-max-h-52 tw-overflow-y-auto tw-hide-scrollbar">
            {(workspace) => (
              <ComboboxItem
                className="tw-gap-1.5 tw-pl-2 [&_[data-slot=combobox-item-indicator]]:tw-hidden"
                key={workspace.id}
                value={workspace}
              >
                <Avatar workspaceName={workspace.name} />

                <TruncatedText
                  arrow
                  content={decodeEntities(workspace.name ?? '')}
                  className="tw-font-body-default tw-truncate tw-flex-1 tw-min-w-0 tw-mb-0"
                >
                  {decodeEntities(workspace.name ?? '')}
                </TruncatedText>

                <LicenseBadge workspaceDetails={workspace} />
              </ComboboxItem>
            )}
          </ComboboxList>

          <ComboboxEmpty>No workspaces found</ComboboxEmpty>

          <ComboboxSeparator className="tw-hidden has-[+*]:tw-block" />

          <CreateWorkspaceBtn workspacesLimit={workspacesLimit} onAddWorkspace={handleAddNewWorkspace} />
        </ComboboxContent>
      </Combobox>
    </>
  );
}
