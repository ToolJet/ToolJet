import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";
import SolidIcon from "@/_ui/Icon/SolidIcons";

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
      ...props
    },
    ref
  ) => {
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
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Logo */}
          <div className="tw-flex tw-items-center tw-justify-center tw-w-7 tw-h-7 tw-rounded-lg tw-bg-transparent">
            {logo || (
              <SolidIcon name="TooljetLogoText" fill="var(--icon-brand)" />
            )}
          </div>

          {/* Workspace Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="small"
                className="tw-h-8 tw-px-2 tw-gap-1 tw-text-text-default tw-font-medium tw-text-xs tw-leading-[18px] hover:tw-bg-background-accent-weak"
              >
                <span className="tw-truncate tw-max-w-[120px]">
                  {workspaceName}
                </span>
                <ChevronDown className="tw-w-4 tw-h-4 tw-text-icon-default" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="tw-w-[200px]">
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id || workspace.name}
                  onClick={() => onWorkspaceChange?.(workspace)}
                  className="tw-cursor-pointer"
                >
                  {workspace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center section - Search */}
        <div className="tw-flex tw-items-center tw-flex-1 tw-justify-center tw-max-w-md">
          <div className="tw-relative tw-w-full tw-max-w-sm">
            <Search className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-w-4 tw-h-4 tw-text-icon-default tw-pointer-events-none" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="tw-pl-10 tw-pr-4 tw-py-2 tw-h-8 tw-text-xs tw-bg-background-surface-layer-01 tw-border-transparent focus:tw-border-border-accent-strong"
              size="small"
            />
          </div>
        </div>

        {/* Right section - Empty for now, can be extended */}
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Placeholder for future actions */}
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
};

TopBar.defaultProps = {
  className: "",
  workspaceName: "ABC cargo main team",
  workspaces: [],
  searchPlaceholder: "Search",
  searchValue: "",
};

export { TopBar };
