import React from 'react';
import { EllipsisVertical, Pin, PinOff, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import type { ConstantListItem } from '@/_services/types/organizationConstantsV2.types';
import { ENV_CONSTANT_TOOLTIP, ENV_CONSTANT_TOOLTIP_CLASSES } from '../helpers/constants';
import { ConstantTypes, type ConstantType } from '../helpers/constantType';

const MENU_ICON_SIZE = 14;
const MENU_CLASSES = { content: 'tw-w-44' };

interface RowActionsMenuProps {
  item: Pick<ConstantListItem, 'name' | 'source'>;
  variant: ConstantType;
  isPinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
}

// `.env` constants can be pinned but not deleted: their Delete shows as disabled and says why.
export default function RowActionsMenu({ item, variant, isPinned, onTogglePin, onDelete }: RowActionsMenuProps) {
  const isEnv = item.source === 'env';
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
          label: variant === ConstantTypes.Secret ? 'Delete secret' : 'Delete constant',
          icon: <Trash size={MENU_ICON_SIZE} />,
          destructive: true,
          disabled: isEnv,
          onSelect: onDelete,
          wrapper: isEnv
            ? (node: React.ReactElement) => (
                <Tooltip
                  content={ENV_CONSTANT_TOOLTIP}
                  arrow
                  classes={ENV_CONSTANT_TOOLTIP_CLASSES}
                  isTooltipForInteractiveDisabledElement
                >
                  {node}
                </Tooltip>
              )
            : undefined,
        },
      ],
    },
  ];

  return (
    <DropdownMenu
      align="end"
      compact
      classes={MENU_CLASSES}
      sections={sections}
      trigger={
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          aria-label={`More actions for ${item.name}`}
          className="tw-shrink-0"
        >
          <EllipsisVertical size={14} className="tw-text-icon-strong" />
        </Button>
      }
    />
  );
}
