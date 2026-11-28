import React from 'react';
import { Expand } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { cn } from '@/lib/utils';

type ExpandRowButtonProps = {
  /** Shown without a row hover: the id cell holds the keyboard focus. */
  visible: boolean;
  /** Why the row cannot be opened (the edit drawer's rules), or undefined. */
  blockedReason?: string;
  onOpen: () => void;
};

// The id cell's button (Figma "expand row"): hidden until the row is hovered or the cell is focused, it opens the whole
// row in the edit drawer. The grid owns the keyboard, so the button stays out of the tab order.
export function ExpandRowButton({ visible, blockedReason, onOpen }: ExpandRowButtonProps) {
  return (
    <Button
      variant="ghost"
      size="small"
      iconOnly
      tabIndex={-1}
      aria-label="Open row"
      title={blockedReason}
      disabled={!!blockedReason}
      data-cy="expand-row-button"
      className={cn(
        'tw-shrink-0 tw-opacity-0 focus-visible:tw-opacity-100 group-hover/row:tw-opacity-100',
        visible && 'tw-opacity-100'
      )}
      // The cell would take focus or start an edit from these.
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Expand />
    </Button>
  );
}
