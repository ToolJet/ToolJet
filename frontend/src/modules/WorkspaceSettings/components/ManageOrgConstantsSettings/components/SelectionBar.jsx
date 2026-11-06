// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, { useState } from 'react';
import { Pin, PinOff, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import DeleteConstantsDialog from './DeleteConstantsDialog';

const NOUNS = { Secret: 'secret', Global: 'global' };

// Floats above the page footer while rows are selected. The bar owns the delete dialog, its only entry point.
export default function SelectionBar({
  variant,
  selectedIds,
  selectedNames,
  allPinned,
  onClear,
  onPin,
  onUnpin,
  onDelete,
}) {
  const [deleting, setDeleting] = useState(false);
  const count = selectedIds.length;
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
      <Button
        variant="outline"
        size="medium"
        className="tw-border-border-danger-weak tw-text-text-danger"
        onClick={() => setDeleting(true)}
      >
        <Trash size={12} className="tw-text-icon-danger" />
        Delete
      </Button>
      {/* Mounted per open, so the dialog's pending and error state resets each time. */}
      {deleting && (
        <DeleteConstantsDialog
          open
          constants={selectedNames}
          onOpenChange={setDeleting}
          onConfirm={() => onDelete(selectedIds)}
        />
      )}
    </div>
  );
}
