import React, { useState } from 'react';
import { AppsPageLayout } from './Layout';

import { PageContainer } from '@/components/AppsPage/PageContainer';
import { AppsPageHeader } from '@/components/AppsPage/AppsPageHeader';
import { EmptyNoApps } from '@/components/AppsPage/EmptyNoApps';
import { AppsList } from '@/components/AppsPage/AppsList';
import { TablePaginationFooter } from '@/components/AppsPage/TablePaginationFooter';
import { Button } from '@/components/ui/Button/Button';

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { MoreVertical, Play, Smile, SquarePen } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import data from './data.json';

// We need to extract the columns definition from AppsList
// For now, let's create a simplified version or import it
const columns = [
  {
    id: 'select',
    colSpan: 1,
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <div className="tw-flex tw-items-center tw-justify-center tw-size-10">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-relative">
        <div className="tw-opacity-100 group-hover:tw-opacity-0 group-data-[state=selected]:tw-opacity-0 tw-transition-opacity tw-absolute">
          <Smile className="tw-size-4 tw-text-muted-foreground" />
        </div>
        <div className="tw-opacity-0 group-hover:tw-opacity-100 group-data-[state=selected]:tw-opacity-100 tw-transition-opacity tw-z-10">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} className="!tw-h-10" />;
    },
    enableHiding: false,
  },
  {
    accessorKey: 'lastEdited',
    header: () => <div className="tw-w-full tw-text-right">Last edited</div>,
    cell: ({ row }) => {
      const date = new Date(row.original.lastEdited);
      return <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'editedBy',
    header: () => <div className="tw-w-full tw-text-right">Edited by</div>,
    cell: ({ row }) => {
      return <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{row.original.editedBy}</div>;
    },
  },
  {
    id: 'actions',
    cell: () => (
      <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
        <Button variant="ghost" size="medium">
          <Play className="tw-size-4 tw-text-icon-strong" />
          Play
        </Button>
        <Button variant="secondary" size="medium">
          <SquarePen className="tw-size-4 tw-text-icon-accent" />
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:tw-bg-muted tw-text-muted-foreground tw-flex tw-size-6"
              size="medium"
              iconOnly
            >
              <MoreVertical className="tw-text-icon-strong" />
              <span className="tw-sr-only">Open menu</span>
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
      </div>
    ),
  },
];

function TableCellViewer({ item }) {
  // const isMobile = useIsMobile();

  return (
    <Button
      variant="link"
      className="tw-text-foreground tw-w-fit tw-px-0 tw-text-left tw-py-0 tw-h-6 tw-text-lg tw-font-normal"
    >
      {item.name}
    </Button>
  );
}

export default {
  title: 'Flows/AppsPage/Layout',
  component: AppsPageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    searchPlaceholder: {
      control: 'text',
      description: 'Search input placeholder text',
    },
  },
};

const EmptyState = () => {
  const menuItems = [
    {
      label: 'Import template',
      onClick: () => console.log('Import template'),
      icon: 'Download',
    },
  ];

  return (
    <PageContainer>
      <div className="tw-space-y-4">
        <AppsPageHeader
          title="Applications"
          onCreateBlankApp={() => console.log('Create blank app')}
          onBuildWithAI={() => console.log('Build with AI')}
          createAppMenuItems={menuItems}
        />
        <EmptyNoApps />
      </div>
    </PageContainer>
  );
};

const Template = (args) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value) => {
    setSearchValue(value);
    console.log('Search:', value);
  };

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <AppsPageLayout {...args} searchValue={searchValue} onSearch={handleSearch}>
        <EmptyState />
      </AppsPageLayout>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  searchPlaceholder: 'Search',
};

export const AppsPageListView = () => {
  const menuItems = [
    {
      label: 'Import template',
      onClick: () => console.log('Import template'),
      icon: 'Download',
    },
  ];
  const [searchValue, setSearchValue] = useState('');

  // Table state management
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <AppsPageLayout searchPlaceholder="Search apps..." searchValue={searchValue} onSearch={setSearchValue}>
        <PageContainer footer={<TablePaginationFooter table={table} />}>
          <div className="tw-space-y-4">
            <AppsPageHeader
              title="Applications"
              onCreateBlankApp={() => console.log('Create blank app')}
              onBuildWithAI={() => console.log('Build with AI')}
              createAppMenuItems={menuItems}
            />
            <AppsList data={data} table={table} />
          </div>
        </PageContainer>
      </AppsPageLayout>
    </div>
  );
};
