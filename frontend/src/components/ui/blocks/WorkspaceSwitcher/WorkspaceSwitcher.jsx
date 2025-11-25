import * as React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Rocket/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/Rocket/dropdown-menu';
import { WorkspaceListItem } from './WorkspaceListItem';

export function WorkspaceSwitcher({ workspaces, activeWorkspace, onWorkspaceChange }) {
  if (!activeWorkspace || !workspaces.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="tw-gap-1">
          <span className="tw-truncate tw-max-w-[120px]">{activeWorkspace.name}</span>
          <ChevronDown className="tw-w-4 tw-h-4 tw-text-icon-default" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="tw-w-[--radix-dropdown-menu-trigger-width] tw-min-w-56 tw-rounded-lg tw-p-0"
        align="start"
        side="down"
        sideOffset={4}
      >
        <DropdownMenuLabel className="tw-text-xs tw-text-muted-foreground tw-flex tw-items-center tw-gap-1 tw-h-10 tw-border-b tw-border-border-weak tw-border-solid">
          <span className="tw-font-body-default !tw-font-medium tw-text-text-default">Workspaces</span>
          <Badge variant="secondary">{workspaces.length}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="tw-px-2 tw-pt-2 tw-pb-1">
          {workspaces.map((workspace, index) => (
            <WorkspaceListItem
              key={workspace.name}
              workspace={workspace}
              index={index}
              checked={activeWorkspace?.name === workspace.name}
              onClick={() => onWorkspaceChange?.(workspace)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onWorkspaceChange?.(workspace);
                }
              }}
            />
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="tw-px-2 tw-pt-1 tw-pb-2">
          <Button variant="ghost" size="default" className="tw-w-full tw-justify-center">
            <Plus width={16} height={16} />
            <span className="tw-font-body-default !tw-font-medium tw-text-text-default">Add workspace</span>
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

WorkspaceSwitcher.propTypes = {
  workspaces: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      logo: PropTypes.elementType.isRequired,
      plan: PropTypes.string,
    })
  ).isRequired,
};
