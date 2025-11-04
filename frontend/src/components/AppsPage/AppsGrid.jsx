import * as React from 'react';
import { Smile } from 'lucide-react';
import AppListItem from '@/components/ui/AppListItem';

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInMinutes / 1440);
  return `${days}d ago`;
};

// Color variants for app icons (matching Figma design)
const iconColors = [
  'tw-bg-blue-500',
  'tw-bg-green-500',
  'tw-bg-purple-500',
  'tw-bg-orange-500',
  'tw-bg-pink-500',
  'tw-bg-yellow-500',
  'tw-bg-indigo-500',
  'tw-bg-red-500',
];

export function AppsGrid({ table }) {
  const rows = table.getRowModel().rows;

  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6 tw-mt-6">
      {rows.map((row, index) => {
        const app = row.original;
        const timeAgo = formatTimeAgo(app.lastEdited);
        const iconColor = iconColors[index % iconColors.length];

        return (
          <AppListItem
            key={row.id}
            icon={
              <div className={`tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center ${iconColor}`}>
                <Smile className="tw-w-3 tw-h-3 tw-text-white" />
              </div>
            }
            title={app.name}
            description={`Edited ${timeAgo} by ${app.editedBy}`}
            variant="outline"
            className="tw-p-4 tw-flex-col tw-items-start"
          />
        );
      })}
    </div>
  );
}
