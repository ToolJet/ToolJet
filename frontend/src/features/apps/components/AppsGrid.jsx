import * as React from 'react';
import { Smile } from 'lucide-react';
import { ResourceCard } from '@/components/ui/blocks/ResourceCard/ResourceCard';
import { ResourceGrid } from '@/components/ui/blocks/ResourceGrid/ResourceGrid';

// Note: AppsGrid is a thin wrapper that provides app-specific formatting logic.
// The generic ResourceGrid handles the grid layout, while AppsGrid handles app-specific rendering.

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
  'tw-text-blue-500',
  'tw-text-green-500',
  'tw-text-purple-500',
  'tw-text-orange-500',
  'tw-text-pink-500',
  'tw-text-yellow-500',
  'tw-text-indigo-500',
  'tw-text-red-500',
];

export const AppsGrid = ({ table, actions, perms, canDelete }) => {
  const rows = table.getRowModel().rows;
  const items = rows.map((row) => row.original);

  const renderAppCard = (app, index) => {
    const timeAgo = formatTimeAgo(app.lastEdited);
    const iconColor = iconColors[index % iconColors.length];

    return (
      <ResourceCard
        key={app.id}
        icon={
          <div className="tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center">
            <Smile className={`tw-w-5 tw-h-5 ${iconColor}`} />
          </div>
        }
        title={app.name}
        description={`Edited ${timeAgo} by ${app.editedBy}`}
        variant="outline"
        className="tw-p-4 tw-flex-col tw-items-start"
        item={app}
        actions={actions}
        canPlay={perms?.canPlay?.(app) ?? true}
        canEdit={perms?.canEdit?.(app) ?? true}
        canDelete={canDelete}
      />
    );
  };

  return <ResourceGrid items={items} renderItem={renderAppCard} />;
};
