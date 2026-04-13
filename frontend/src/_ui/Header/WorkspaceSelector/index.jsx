import React from 'react';
import { SelectItemText } from '@radix-ui/react-select';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/Rocket/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { getAvatar, decodeEntities } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import TruncatedText from '@/pages/shared/components/TruncatedText';

import CreateWorkspaceBtn from './CreateWorkspaceBtn';

function WorkspaceSelector({ workspaceList, onSwitchWorkspace, onCreateNewWorkspace, onEditWorkspace }) {
  return (
    <BaseWorkspaceSelector
      workspaceList={workspaceList}
      onSwitchWorkspace={onSwitchWorkspace}
      onEditWorkspace={onEditWorkspace}
      onCreateNewWorkspace={onCreateNewWorkspace}
    />
  );
}

export default withEditionSpecificComponent(WorkspaceSelector, 'common');

export function BaseWorkspaceSelector(props) {
  const {
    workspaceList,
    onSwitchWorkspace,
    onEditWorkspace,
    onCreateNewWorkspace,
    // ee specific props
    workspacesLimit = null,
    renderLicenseBadge = null,
    renderManageWorkspacesBtn = null,
  } = props;
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { current_organization_id: selectedWorkspaceId, admin: isAdmin } = authenticationService.currentSessionValue;

  const currentWorkspaceDetails = workspaceList?.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;

  return (
    <>
      <Select value={selectedWorkspaceId} onValueChange={onSwitchWorkspace}>
        <SelectTrigger
          showIcon
          data-cy="workspace-selector-trigger"
          className="tw-rounded-md tw-max-w-40 tw-shadow-none tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-border-0 hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected"
        >
          <SelectValue data-cy="workspace-name" className="tw-font-title-default" />
        </SelectTrigger>

        <SelectContent
          className={cn('tw-w-60 tw-border tw-border-solid tw-border-border-weak', {
            'dark-theme theme-dark': darkMode,
          })}
        >
          <header className="tw-px-2 py-1">
            {Boolean(currentWorkspaceDetails) && (
              <div className="tw-space-y-1.5">
                <div className="tw-flex tw-justify-between tw-items-center gap-1">
                  <Avatar workspaceName={currentWorkspaceDetails.name} className="tw-size-8" />

                  <div className="tw-flex tw-items-center tw-gap-1 has-[+*]:tw-self-end">
                    {isAdmin && (
                      <Button
                        isLucid
                        iconOnly
                        size="medium"
                        variant="ghost"
                        leadingIcon="square-pen"
                        onClick={onEditWorkspace}
                      />
                    )}

                    {renderManageWorkspacesBtn?.()}
                  </div>
                </div>

                <TruncatedText
                  content={decodeEntities(currentWorkspaceDetails.name ?? '')}
                  className="tw-inline-block tw-text-text-default tw-font-title-large tw-truncate tw-w-full"
                >
                  {decodeEntities(currentWorkspaceDetails.name ?? '')}
                </TruncatedText>

                {renderLicenseBadge?.(currentWorkspaceDetails)}
              </div>
            )}
          </header>

          <SelectSeparator className="tw-bg-border-weak" />

          <SelectGroup className="tw-h-56 tw-overflow-y-auto tw-hide-scrollbar">
            {workspaceList?.map((workspace) => (
              <SelectItem className="tw-gap-1.5 tw-pl-2" key={workspace.id} value={workspace.id} showCheckIcon={false}>
                <Avatar workspaceName={workspace.name} />

                <SelectItemText asChild>
                  <TruncatedText
                    content={decodeEntities(workspace.name ?? '')}
                    className="tw-font-body-default tw-truncate tw-flex-1 tw-min-w-0 tw-mb-0"
                  >
                    {decodeEntities(workspace.name ?? '')}
                  </TruncatedText>
                </SelectItemText>

                {renderLicenseBadge?.(workspace)}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator className="tw-bg-border-weak tw-hidden has-[+*]:tw-block" />

          <CreateWorkspaceBtn onAddWorkspace={onCreateNewWorkspace} workspacesLimit={workspacesLimit} />
        </SelectContent>
      </Select>
    </>
  );
}

function Avatar({ workspaceName, className }) {
  return (
    <div
      data-cy={`${String(workspaceName).toLowerCase().replace(/\s+/g, '-')}-avatar`}
      className={cn(
        'tw-flex tw-justify-center tw-items-center tw-uppercase tw-bg-interactive-hover tw-rounded tw-size-6',
        className
      )}
    >
      <span className="tw-font-body-small tw-text-text-placeholder">{getAvatar(workspaceName)}</span>
    </div>
  );
}
