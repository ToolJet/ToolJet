import React from 'react';
import moment from 'moment';
import { AppWindow, Copy, FileUp, FolderInput, FolderOutput, PencilRuler, Smile, Trash } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';
import { Button } from '@/components/ui/Button/Button';

const moreActionOptions = [
  { label: 'Rename app', icon: <AppWindow size={16} color="var(--icon-weak)" />, action: 'rename-app' },
  { label: 'Customize icon', icon: <PencilRuler size={16} color="var(--icon-weak)" />, action: 'customize-icon' },
  // { label: 'Duplicate app', icon: <Copy size={16} color="var(--icon-weak)" />, action: 'duplicate-app' }, // Only for apps/modules
  { label: 'Move to folder', icon: <FolderInput size={16} color="var(--icon-weak)" />, action: 'move-to-folder' },
  {
    label: 'Remove from folder',
    icon: <FolderOutput size={16} color="var(--icon-weak)" />,
    action: 'remove-from-folder',
  },
  { label: 'Export app', icon: <FileUp size={16} color="var(--icon-weak)" />, action: 'export-app' },
  { label: 'Delete app', icon: <Trash size={16} color="var(--icon-weak)" />, action: 'delete-app' },
];

export default function AppCard({
  appDetails,
  appIcon = null,
  appName = 'App name goes here',
  editedBy = 'Edited 2m ago by user',
  onLaunch,
  onEdit,
  onToggleMenu,
  onMenuItemClick,
}) {
  const { name, editing_version, updated_at } = appDetails;

  const updatedAt = editing_version?.updated_at || updated_at;
  const formatedUpdatedAt = moment(updatedAt).fromNow(true);
  // console.log('formatedUpdatedAt', formatedUpdatedAt);

  const textBlock = (
    <div className="tw-flex tw-flex-col tw-gap-0.5 tw-overflow-hidden tw-w-full">
      {/* TODO: Font size to be changed later on based on design */}
      <p className="tw-m-0 tw-text-text-default tw-font-title-default tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap">
        {name}
      </p>

      <p className="tw-m-0 tw-text-text-placeholder tw-font-body-default tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap">
        {`Edited ${formatedUpdatedAt} ${formatedUpdatedAt !== 'just now' ? 'ago' : ''}`}
      </p>
    </div>
  );

  return (
    <div className="tw-group tw-relative tw-h-[6.375rem] tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak tw-rounded-lg tw-cursor-pointer tw-transition-shadow tw-duration-200 hover:tw-shadow-[0px_0px_1px_0px_rgba(48,50,51,0.05),_0px_2px_4px_0px_rgba(48,50,51,0.1)]">
      {/* Rest state: icon at top, text below */}
      <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-gap-3 tw-opacity-100 group-hover:tw-opacity-0 tw-transition-opacity tw-duration-200 tw-pointer-events-auto group-hover:tw-pointer-events-none">
        <div className="tw-flex tw-items-center">{appIcon ?? <Smile size={20} />}</div>

        {textBlock}
      </div>

      {/* Hover state: text at top, action buttons at bottom */}
      <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-pointer-events-none group-hover:tw-pointer-events-auto">
        {textBlock}

        <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
          <Button isLucid variant="ghost" size="medium" leadingIcon="play" onClick={onLaunch} disabled>
            Launch
          </Button>

          <div className="tw-flex tw-items-center tw-gap-2">
            <Button isLucid variant="secondary" size="medium" leadingIcon="square-pen" onClick={onEdit} disabled>
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  isLucid
                  iconOnly
                  size="medium"
                  variant="outline"
                  leadingIcon="ellipsis-vertical"
                  onClick={onToggleMenu}
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                  {moreActionOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.action}
                      className="tw-text-text-default tw-font-body-default"
                      onClick={() => onMenuItemClick(option.action)}
                    >
                      {option.icon}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
