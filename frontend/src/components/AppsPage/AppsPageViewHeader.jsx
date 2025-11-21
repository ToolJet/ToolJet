import * as React from 'react';
import { Rows3, Grid2x2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button/Button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderSelector } from '@/components/ui/blocks/FolderSelector';
import { Skeleton } from '@/components/ui/skeleton';

export function AppsPageViewHeader({
  activeTab = 'apps',
  onTabChange,
  breadcrumbItems = [],
  viewAs = 'list',
  onViewChange,
  // Folder selection props
  folders = [],
  currentFolder = null,
  onFolderChange,
  foldersLoading = false,
  // Count and loading props for badges
  appsCount = 0,
  modulesCount = 0,
  appsLoading = false,
  modulesLoading = false,
}) {
  return (
    <div className="tw-border-b tw-border-border-weak tw-flex tw-items-center tw-justify-between tw-h-10 tw-w-full">
      {/* Left: Apps/Modules tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="hidden @4xl/main:tw-flex">
        <TabsList variant="secondary" size="lg">
          <TabsTrigger value="apps" variant="secondary">
            Apps{' '}
            {appsLoading ? (
              <Skeleton className="tw-h-4 tw-w-6 tw-inline-block tw-ml-1" />
            ) : (
              <Badge variant="secondary">{appsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="modules" variant="secondary">
            Modules{' '}
            {modulesLoading ? (
              <Skeleton className="tw-h-4 tw-w-6 tw-inline-block tw-ml-1" />
            ) : (
              <Badge variant="secondary">{modulesCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Right: Breadcrumb + View toggle */}
      <div className="tw-flex tw-items-center tw-gap-3">
        {appsLoading ? (
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
                              disabled={foldersLoading}
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
  );
}

AppsPageViewHeader.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  breadcrumbItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
    })
  ),
  viewAs: PropTypes.string,
  onViewChange: PropTypes.func,
  // Folder selection props
  folders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  currentFolder: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    count: PropTypes.number,
  }),
  onFolderChange: PropTypes.func,
  foldersLoading: PropTypes.bool,
  // Count and loading props
  appsCount: PropTypes.number,
  modulesCount: PropTypes.number,
  appsLoading: PropTypes.bool,
  modulesLoading: PropTypes.bool,
};

AppsPageViewHeader.defaultProps = {
  activeTab: 'apps',
  onTabChange: null,
  breadcrumbItems: [],
  viewAs: 'list',
  onViewChange: null,
  folders: [],
  currentFolder: null,
  onFolderChange: null,
  foldersLoading: false,
  appsCount: 0,
  modulesCount: 0,
  appsLoading: false,
  modulesLoading: false,
};
