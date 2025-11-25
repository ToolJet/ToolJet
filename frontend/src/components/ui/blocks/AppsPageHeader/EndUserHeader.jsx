import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Rows3, Grid2x2 } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/Rocket/breadcrumb';
import { Button } from '@/components/ui/Button/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket/tabs';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/Rocket/dropdown-menu';
import { FolderSelector } from '@/components/ui/blocks/FolderSelector';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

import { cn } from '@/lib/utils';

const EndUserHeader = forwardRef(
  (
    {
      className,
      title = 'Applications',
      breadcrumbItems = [],
      isLoading, // Folder selection props
      folders = [],
      currentFolder = null,
      onFolderChange,
      viewAs = 'list',
      onViewChange,
      ...props
    },
    ref
  ) => {
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
          {/* Right: Breadcrumb + View toggle */}
          <div className="tw-flex tw-items-center tw-gap-3">
            {isLoading ? (
              <div className="tw-flex tw-items-center tw-gap-1">
                <Skeleton className="tw-h-5 tw-w-16" />
                <Skeleton className="tw-h-3 tw-w-3" />
                <Skeleton className="tw-h-5 tw-w-20" />
              </div>
            ) : (
              breadcrumbItems.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => (
                      <React.Fragment key={item.label || index}>
                        <BreadcrumbItem>
                          {index === breadcrumbItems.length - 1 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="-tw-ml-2 data-[state=open]:tw-bg-interactive-hover"
                                  size="small"
                                  variant="ghost"
                                  disabled={isLoading}
                                >
                                  {item.label}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="tw-min-w-48 tw-p-0">
                                <FolderSelector
                                  folders={folders}
                                  currentFolder={currentFolder}
                                  onFolderChange={onFolderChange}
                                  onNewFolder={() => {
                                    // Handle new folder creation
                                    // TODO: Implement new folder creation logic
                                  }}
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <BreadcrumbLink href="#">{item.label}</BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )
            )}

            {/* View toggle */}
            <Tabs value={viewAs} onValueChange={onViewChange}>
              <TabsList size="sm" className="tw-p-0.5">
                <TabsTrigger value="list" className="tw-p-1 tw-h-7 tw-w-7">
                  <Rows3 className="tw-h-4 tw-w-4" />
                </TabsTrigger>
                <TabsTrigger value="grid" className="tw-p-1 tw-h-7 tw-w-7">
                  <Grid2x2 className="tw-h-4 tw-w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
);

EndUserHeader.displayName = 'EndUserHeader';

EndUserHeader.propTypes = {
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

EndUserHeader.defaultProps = {
  className: '',
  title: 'Applications',
  createAppMenuItems: [],
};

export { EndUserHeader };
