import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { TeamSwitcher } from "@/components/ui/blocks/Sidebar/team-switcher";
import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react";
import { TopBarSearch } from "@/components/ui/blocks/TopBarSearch";

import SolidIcon from "@/_ui/Icon/SolidIcons";

const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

const TopBar = forwardRef(
  (
    {
      className,
      logo,
      workspaceName = "ABC cargo main team",
      workspaces = [],
      onWorkspaceChange,
      searchPlaceholder = "Search",
      onSearch,
      searchValue,
      // New slot props
      topbarLeftSlot, // Search area slot (center)
      topbarRightSlot, // Right side actions slot
      ...props
    },
    ref
  ) => {
    // Default search component (for backward compatibility)
    const defaultSearch = (
      <TopBarSearch
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearch}
      />
    );

    return (
      <div
        ref={ref}
        className={cn(
          "tw-flex tw-items-center tw-justify-between tw-border-b tw-border-border-weak tw-bg-background-surface-layer-01 tw-pl-2 tw-pr-8 tw-py-0 tw-h-[48px]",
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

        {/* Center section - Search (slot or default) */}
        {topbarLeftSlot || (onSearch != null && defaultSearch)}

        {/* Right section - Actions (slot or empty) */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-justify-end">
          {topbarRightSlot}
        </div>
      </div>
    );
  }
);

TopBar.displayName = "TopBar";

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
  topbarLeftSlot: PropTypes.node, // Search area slot (center)
  topbarRightSlot: PropTypes.node, // Right side actions slot
};

TopBar.defaultProps = {
  className: "",
  workspaceName: "ABC cargo main team",
  workspaces: [],
  searchPlaceholder: "Search",
  searchValue: "",
};

export { TopBar };
