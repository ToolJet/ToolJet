import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const AppsPageHeader = forwardRef(
  ({ className, title = 'Applications', onCreateBlankApp, onBuildWithAI, createAppMenuItems = [], ...props }, ref) => {
    return (
      <div ref={ref} className={cn('tw-flex tw-items-center tw-justify-between tw-w-full', className)} {...props}>
        {/* Title Section */}
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-flex tw-flex-col tw-items-start tw-justify-center">
            <h1 className="tw-text-text-medium tw-text-[22px] tw-font-medium tw-leading-[35.2px] tw-tracking-[-0.64px] tw-whitespace-pre">
              {title}
            </h1>
          </div>
        </div>

        {/* Action Group */}
        <div className="tw-flex tw-items-center tw-gap-1">
          {/* Create Blank App Button */}
          <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={onCreateBlankApp} className="">
            Create blank app
          </Button>

          {/* Build with AI Button */}
          <Button variant="outline" size="default" leadingIcon="tooljetai" onClick={onBuildWithAI}>
            Build with AI assistant
          </Button>

          {/* More Options Dropdown */}
          {createAppMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" iconOnly isLucid leadingIcon="more-vertical" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="tw-w-[200px]">
                {createAppMenuItems.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={item.onClick} className="tw-cursor-pointer">
                    {item.icon && <SolidIcon name={item.icon} fill="var(--icon-default)" />}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }
);

AppsPageHeader.displayName = 'AppsPageHeader';

AppsPageHeader.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  onCreateBlankApp: PropTypes.func,
  onBuildWithAI: PropTypes.func,
  createAppMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.string,
    })
  ),
};

AppsPageHeader.defaultProps = {
  className: '',
  title: 'Applications',
  createAppMenuItems: [],
};

export { AppsPageHeader };
