import * as React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TeamSwitcher({ teams }) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="tw-gap-1">
          <span className="tw-truncate tw-max-w-[120px]">{activeTeam.name}</span>
          <ChevronDown className="tw-w-4 tw-h-4 tw-text-icon-default" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="tw-w-[--radix-dropdown-menu-trigger-width] tw-min-w-56 tw-rounded-lg"
        align="start"
        side="down"
        sideOffset={4}
      >
        <DropdownMenuLabel className="tw-text-xs tw-text-muted-foreground">Teams</DropdownMenuLabel>
        {teams.map((team, index) => (
          <DropdownMenuItem key={team.name} onClick={() => setActiveTeam(team)} className="tw-gap-2 tw-p-2">
            <div className="tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-sm tw-border">
              <team.logo className="tw-size-4 tw-shrink-0" />
            </div>
            {team.name}
            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="tw-gap-2 tw-p-2">
          <div className="tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-md tw-border tw-bg-background">
            <Plus className="tw-size-4" />
          </div>
          <div className="tw-font-medium tw-text-muted-foreground">Add team</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

