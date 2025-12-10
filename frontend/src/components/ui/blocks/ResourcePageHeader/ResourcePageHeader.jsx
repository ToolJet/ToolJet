import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';

const ResourcePageHeader = forwardRef(
  ({ className, title = 'Applications', rightSlot, contextMenuItems = [], ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('tw-flex tw-items-center tw-justify-between tw-w-full tw-mb-5', className)}
        {...props}
      >
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
          {/* Right Slot Content */}
          {rightSlot}
          {/* More Options Dropdown */}
          {contextMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" iconOnly isLucid leadingIcon="more-vertical" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="tw-w-[200px]">
                {contextMenuItems.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={item.onClick} className="tw-cursor-pointer">
                    {item.icon && <DynamicIcon name={item.icon} size={16} className={'tw-text-icon-default'} />}
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

ResourcePageHeader.displayName = 'ResourcePageHeader';

ResourcePageHeader.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  rightSlot: PropTypes.node,
  contextMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.string,
    })
  ),
};

ResourcePageHeader.defaultProps = {
  className: '',
  title: 'Applications',
  contextMenuItems: [],
};

export { ResourcePageHeader };
