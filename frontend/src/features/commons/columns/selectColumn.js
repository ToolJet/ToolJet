import React from 'react';
import { Checkbox } from '@/components/ui/Rocket/checkbox';
import { Smile } from 'lucide-react';

const iconColors = [
  'tw-text-blue-500',
  'tw-text-green-500',
  'tw-text-purple-500',
  'tw-text-orange-500',
  'tw-text-pink-500',
  'tw-text-yellow-500',
  'tw-text-indigo-500',
  'tw-text-red-500',
];

export const createSelectColumn = () => {
  return {
    id: 'select',
    colSpan: 1,
    size: 40,
    header: ({ table }) => (
      <div className="tw-flex tw-items-center tw-justify-center tw-size-10">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      const iconColor = iconColors[Math.floor(Math.random() * iconColors.length)];
      // return (
      //   <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-relative">
      //     <div className="tw-opacity-100 group-hover:tw-opacity-0 group-data-[state=selected]:tw-opacity-0 tw-transition-opacity tw-absolute">
      //       <Smile className={`tw-size-4 tw-text-muted-foreground ${iconColor}`} />
      //     </div>
      //     <div className="tw-opacity-0 group-hover:tw-opacity-100 group-data-[state=selected]:tw-opacity-100 tw-transition-opacity tw-z-10">
      //       <Checkbox
      //         checked={row.getIsSelected()}
      //         onCheckedChange={(value) => row.toggleSelected(!!value)}
      //         aria-label="Select row"
      //       />
      //     </div>
      //   </div>
      // );
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-relative">
          <div className="">
            <Smile className={`tw-size-4 tw-text-muted-foreground ${iconColor}`} />
          </div>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };
};
