// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, { useState } from 'react';
import { Pin, PinOff, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { ENV_CONSTANT_TOOLTIP, ENV_CONSTANT_TOOLTIP_CLASSES } from '../helpers/constants';
import { ConstantTypes, type ConstantType } from '../helpers/constantType';
import DeleteConstantsDialog from './DeleteConstantsDialog';

const NOUNS: Record<ConstantType, string> = { [ConstantTypes.Secret]: 'secret', [ConstantTypes.Global]: 'global' };

interface SelectionBarProps {
  variant: ConstantType;
  selectedIds: string[];
  deletableIds: string[];
  deletableNames: string[];
  allPinned: boolean;
  onClear: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onDelete: (ids: string[]) => Promise<unknown>;
}

// Floats above the page footer while rows are selected. The bar owns the delete dialog, its only entry point.
// `.env` constants can be pinned but not deleted, so Delete takes only the deletable rows of the selection
// (`deletableIds` / `deletableNames`) and is disabled when there are none.
export default function SelectionBar({
  variant,
  selectedIds,
  deletableIds,
  deletableNames,
  allPinned,
  onClear,
  onPin,
  onUnpin,
  onDelete,
}: SelectionBarProps) {
  const [deleting, setDeleting] = useState(false);
  const count = selectedIds.length;
  const canDelete = deletableIds.length > 0;
  const PinIcon = allPinned ? PinOff : Pin;

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className="tw-flex tw-h-10 tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-3 tw-shadow-[shadow:var(--elevation-300-box-shadow)]"
    >
      <span className="tw-whitespace-nowrap tw-font-body-default tw-text-text-default">
        {`${count} ${NOUNS[variant]}${count === 1 ? '' : 's'} selected`}
      </span>
      <Button variant="ghostBrand" size="medium" className="tw-px-1 tw-underline" onClick={onClear}>
        Clear
      </Button>
      <Separator decorative orientation="vertical" className="tw-h-5 tw-bg-border-default" />
      <Button variant="outline" size="medium" onClick={allPinned ? onUnpin : onPin}>
        <PinIcon size={12} className="tw-text-icon-strong" />
        {allPinned ? 'Unpin' : 'Pin'}
      </Button>
      <Tooltip
        content={canDelete ? undefined : ENV_CONSTANT_TOOLTIP}
        arrow
        classes={ENV_CONSTANT_TOOLTIP_CLASSES}
        isTooltipForInteractiveDisabledElement
      >
        <Button
          variant="outline"
          size="medium"
          className="tw-border-border-danger-weak tw-text-text-danger"
          disabled={!canDelete}
          onClick={() => setDeleting(true)}
        >
          <Trash size={12} className="tw-text-icon-danger" />
          Delete
        </Button>
      </Tooltip>
      {/* Mounted per open, so the dialog's pending and error state resets each time. */}
      {deleting && (
        <DeleteConstantsDialog
          open
          constants={deletableNames}
          onOpenChange={setDeleting}
          onConfirm={() => onDelete(deletableIds)}
        />
      )}
    </div>
  );
}
