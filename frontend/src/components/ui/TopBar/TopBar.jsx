import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { TeamSwitcher } from '@/components/Sidebar/team-switcher';
import { Search, AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';

import SolidIcon from '@/_ui/Icon/SolidIcons';

const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
};

const TopBar = forwardRef(
  (
    {
      className,
      logo,
      workspaceName = 'ABC cargo main team',
      workspaces = [],
      onWorkspaceChange,
      searchPlaceholder = 'Search',
      onSearch,
      searchValue,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'tw-flex tw-items-center tw-justify-between tw-border-b tw-border-border-weak tw-bg-background-surface-layer-01 tw-pl-2 tw-pr-8 tw-py-0 tw-h-[48px]',
          className
        )}
        {...props}
      >
        {/* Left section - Logo and Workspace Switcher */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">
          {/* Logo */}
          <div className="tw-flex tw-items-center tw-justify-center tw-size-7 tw-rounded-lg tw-bg-transparent">
            {logo || <SolidIcon name="tooljetai" fill="var(--icon-brand)" />}
          </div>

          <TeamSwitcher teams={data.teams} />
        </div>

        {/* Center section - Search */}
        <div className="tw-flex tw-items-center tw-flex-1 tw-justify-center tw-max-w-md">
          <div className="tw-group tw-relative tw-w-[180px]">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="tw-pl-[60px] tw-pr-4 tw-py-1 tw-h-8 tw-text-xs tw-bg-background-surface-layer-01 tw-border-transparent hover:tw-bg-interactive-hover focus:tw-border-border-accent-strong focus:tw-pl-[34px] tw-transition-all tw-duration-200"
              size="small"
            />
            <Search
              width={16}
              height={16}
              className="tw-absolute tw-left-[38px] group-focus-within:!tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-icon-default tw-pointer-events-none tw-transition-all tw-duration-200"
            />
          </div>
        </div>

        {/* Right section - Empty for now, can be extended */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">{/* Placeholder for future actions */}</div>
      </div>
    );
  }
);

TopBar.displayName = 'TopBar';

TopBar.propTypes = {
  className: PropTypes.string,
  logo: PropTypes.node,
  workspaceName: PropTypes.string,
  workspaces: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.string,
    })
  ),
  onWorkspaceChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
};

TopBar.defaultProps = {
  className: '',
  workspaceName: 'ABC cargo main team',
  workspaces: [],
  searchPlaceholder: 'Search',
  searchValue: '',
};

export { TopBar };
