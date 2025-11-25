import React from 'react';
import { AppsTableSkeleton } from '../AppsTableSkeleton';
import { Table, TableHeader, TableHead, TableRow } from '@/components/ui/Rocket/table';

export default {
  title: 'AppsPage/AppsTableSkeleton',
  component: AppsTableSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    rowCount: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Number of skeleton rows to display',
    },
  },
};

const Template = (args) => (
  <div className="tw-overflow-hidden">
    <Table>
      <AppsTableSkeleton {...args} />
    </Table>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  rowCount: 5,
};

export const ThreeRows = Template.bind({});
ThreeRows.args = {
  rowCount: 3,
};

export const TenRows = Template.bind({});
TenRows.args = {
  rowCount: 10,
};

export const InTableContext = () => (
  <div className="tw-overflow-hidden">
    <Table>
      <TableHeader className="tw-sticky tw-top-0 tw-z-10 [&_tr]:hover:tw-bg-transparent">
        <TableRow>
          <TableHead>
            <div className="tw-flex tw-items-center tw-justify-center tw-size-10"></div>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>
            <div className="tw-w-full tw-text-right">Last edited</div>
          </TableHead>
          <TableHead>
            <div className="tw-w-full tw-text-right">Edited by</div>
          </TableHead>
          <TableHead>
            <div className="tw-w-full tw-text-right">Actions</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <AppsTableSkeleton rowCount={5} />
    </Table>
  </div>
);
InTableContext.parameters = {
  docs: {
    description: {
      story: 'Skeleton shown within full table context with header row.',
    },
  },
};

