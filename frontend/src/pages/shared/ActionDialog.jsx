import React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Rocket/dialog';

export default function ActionDialog({
  open,
  handleOpenChange,
  cancelBtnProps,
  submitBtnProps,
  children,
  title = null,
  classes = null,
  ...dialogBodyProps
}) {
  const { label: submitBtnLabel, ...submitBtnPropsRest } = submitBtnProps;
  const { label: cancelBtnLabel, ...cancelBtnPropsRest } = cancelBtnProps;

  const DialogBody = Slot;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('tw-w-full tw-max-w-96 tw-p-0 tw-gap-0', classes?.dialogContent)}
      >
        {title && (
          <DialogHeader className="tw-border-b tw-border-border-weak tw-px-6 tw-py-4">
            <DialogTitle className="tw-font-title-x-large tw-text-text-default">{title}</DialogTitle>
          </DialogHeader>
        )}

        <DialogBody className={cn('tw-px-6 tw-py-4', classes?.dialogBody)} {...dialogBodyProps}>
          {children}
        </DialogBody>

        <DialogFooter className={cn('tw-px-6 tw-py-4 sm:tw-justify-between sm:tw-items-center', classes?.dialogFooter)}>
          <Button variant="outline" size="default" {...cancelBtnPropsRest}>
            {cancelBtnLabel ?? 'Cancel'}
          </Button>

          <Button variant="primary" size="default" {...submitBtnPropsRest}>
            {submitBtnLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
