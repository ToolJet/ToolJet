import React from 'react';
import { EllipsisVertical, Pin, PinOff, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';

const MENU_ICON_SIZE = 14;
const MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
  group: 'tw-p-2',
};
// Hidden until the row is hovered or focused, or its menu is open (which keeps the menu's anchor in view).
// Opacity rather than display, so the button stays reachable by keyboard.
const REVEAL_CLASS =
  'tw-opacity-0 group-hover:tw-opacity-100 group-focus-within:tw-opacity-100 data-[state=open]:tw-opacity-100';

// `.env` constants can be neither pinned nor deleted, so they have no menu.
export default function RowActionsMenu({ item, variant, isPinned, onTogglePin, onDelete }) {
  if (item.source === 'env') return null;

  const PinIcon = isPinned ? PinOff : Pin;
  const sections = [
    {
      id: 'pin',
      items: [
        {
          id: 'pin',
          label: isPinned ? 'Unpin' : 'Pin',
          icon: <PinIcon size={MENU_ICON_SIZE} />,
          onSelect: onTogglePin,
        },
      ],
    },
    {
      id: 'danger',
      items: [
        {
          id: 'delete',
          label: variant === 'Secret' ? 'Delete secret' : 'Delete constant',
          icon: <Trash size={MENU_ICON_SIZE} />,
          destructive: true,
          onSelect: onDelete,
        },
      ],
    },
  ];

  return (
    <DropdownMenu
      align="end"
      classes={MENU_CLASSES}
      sections={sections}
      trigger={
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          aria-label={`More actions for ${item.name}`}
          className={cn('tw-shrink-0', REVEAL_CLASS)}
        >
          <EllipsisVertical size={14} className="tw-text-icon-strong" />
        </Button>
      }
    />
  );
}
