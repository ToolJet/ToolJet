import * as React from 'react';
import { Rows3, Grid2x2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Badge } from '@/components/ui/Rocket/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket/tabs';
import { Button } from '@/components/ui/Button/Button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/Rocket/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/Rocket/dropdown-menu';
import { FolderSelector } from '@/components/ui/blocks/FolderSelector';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

export function ResourceViewHeader({
  activeTab = 'apps',
  onTabChange,
  tabsConfig = [],
  breadcrumbItems = [],
  viewMode = 'list',
  onViewModeChange,
  // Folder selection props
  folders = [],
  currentFolder = null,
  onFolderChange,
  foldersLoading = false,
}) {
  return (
    <div className="tw-border-b tw-border-border-weak tw-flex tw-items-center tw-justify-between tw-h-10 tw-w-full">
      {/* Left: Apps/Modules tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="hidden @4xl/main:tw-flex">
        <TabsList variant="secondary" size="lg">
          {tabsConfig.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} variant="secondary">
              {tab.label}{' '}
              {tab.loading ? (
                <Skeleton className="tw-h-4 tw-w-6 tw-inline-block tw-ml-1" />
              ) : (
                <Badge variant="secondary">{tab.count}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Right: Breadcrumb + View toggle */}
      <div className="tw-flex tw-items-center tw-gap-3">
        {foldersLoading ? (
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
                              onNewFolder={() => {}}
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
        <Tabs value={viewMode} onValueChange={onViewModeChange}>
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

ResourceViewHeader.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  tabsConfig: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
      loading: PropTypes.bool,
    })
  ),
  breadcrumbItems: PropTypes.array,
  viewMode: PropTypes.string,
  onViewModeChange: PropTypes.func,
  folders: PropTypes.array,
  currentFolder: PropTypes.object,
  onFolderChange: PropTypes.func,
  foldersLoading: PropTypes.bool,
};
