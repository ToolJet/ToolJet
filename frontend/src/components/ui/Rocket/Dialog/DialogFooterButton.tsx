import React, { forwardRef, type ReactNode } from 'react';

import { Button, type ButtonProps } from '@/components/ui/Rocket/Button/Button';

/** Footer action config shared by DialogMessage and DialogAction. */
type DialogFooterAction = Omit<ButtonProps, 'variant' | 'children'> & { label: ReactNode };

type DialogFooterButtonProps = DialogFooterAction & Pick<ButtonProps, 'variant'>;

// forwardRef so DialogClose's asChild Slot can attach its ref and click handler.
const DialogFooterButton = forwardRef<HTMLButtonElement, DialogFooterButtonProps>(function DialogFooterButton(
  { label, ...props },
  ref
) {
  return (
    <Button ref={ref} {...props}>
      {label}
    </Button>
  );
});

DialogFooterButton.displayName = 'DialogFooterButton';

export default DialogFooterButton;
export type { DialogFooterAction, DialogFooterButtonProps };
