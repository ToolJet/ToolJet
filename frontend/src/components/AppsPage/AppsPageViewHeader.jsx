import * as React from 'react';
import { Rows3, Grid2x2 } from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppsPageViewHeader({
  activeTab = 'apps',
  onTabChange,
  breadcrumbItems = [],
  viewAs = 'list',
  onViewChange,
}) {
  return (
    <div className="tw-border-b tw-border-border-weak tw-flex tw-items-center tw-justify-between tw-h-10 tw-w-full">
      {/* Left: Apps/Modules tabs */}
      <TabsList variant="secondary" size="lg" className="hidden @4xl/main:tw-flex">
        <TabsTrigger value="apps" variant="secondary">
          Apps <Badge variant="secondary">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="modules" variant="secondary">
          Modules <Badge variant="secondary">3</Badge>
        </TabsTrigger>
      </TabsList>

      {/* Right: Breadcrumb + View toggle */}
      <div className="tw-flex tw-items-center tw-gap-3">
        {/* Breadcrumb */}
        {breadcrumbItems.length > 0 && (
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
                          >
                            {item.label}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="tw-w-32">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Make a copy</DropdownMenuItem>
                          <DropdownMenuItem>Favorite</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
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
