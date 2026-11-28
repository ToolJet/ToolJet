import React, { useRef } from 'react';
import { EllipsisVertical, Trash } from 'lucide-react';
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
  /** Gets the menu button, so the page can return focus to it once the delete dialog closes. */
  onDelete: (opener: HTMLElement | null) => void;
}

// `.env` constants cannot be deleted: their Delete shows as disabled and says why.
export default function RowActionsMenu({ item, variant, onDelete }: RowActionsMenuProps) {
  const isEnv = item.source === 'env';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sections = [
    {
      id: 'danger',
      items: [
        {
          id: 'delete',
          label: variant === ConstantTypes.Secret ? 'Delete secret' : 'Delete constant',
          icon: <Trash size={MENU_ICON_SIZE} />,
          destructive: true,
          disabled: isEnv,
          onSelect: () => onDelete(triggerRef.current),
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
          ref={triggerRef}
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
