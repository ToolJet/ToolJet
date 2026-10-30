import React from 'react';
import { X } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import type { ActionDialogProps, ActionDialogSubmitAction } from './types';

export default function ActionDialog({
  open,
  handleOpenChange,
  cancelBtnProps,
  submitActions,
  children,
  title = null,
  titleIcon = null,
  classes = null,
  modality = true,
  hasFooter = true,
  showCloseButton = false,
  ...dialogBodyProps
}: ActionDialogProps) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { label: cancelBtnLabel, ...cancelBtnPropsRest } = cancelBtnProps ?? {};

  const DialogBody = Slot;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={modality}>
      <DialogContent
        data-cy="modal-component"
        showCloseButton={false}
        className={cn(
          'tw-w-full tw-max-w-96 tw-p-0 tw-gap-0 tw-border-border-weak',
          { 'dark-theme theme-dark': darkMode },
          classes?.dialogContent
        )}
      >
        {title && (
          <DialogHeader className="tw-border-b tw-border-border-weak tw-px-6 tw-py-4 tw-justify-between">
            <DialogTitle
              className="tw-font-title-x-large tw-text-text-default"
              data-cy={`${generateCypressDataCy(title)}-title`}
            >
              {titleIcon} {title}
            </DialogTitle>

            {showCloseButton && (
              <Button
                isLucid
                iconOnly
                variant="ghost"
                size="default"
                {...(cancelBtnProps?.onClick && { onClick: cancelBtnProps.onClick })}
              >
                <X size={16} />
              </Button>
            )}
          </DialogHeader>
        )}

        <DialogBody className={cn('tw-p-6', classes?.dialogBody)} {...dialogBodyProps}>
          {children}
        </DialogBody>

        {hasFooter && submitActions && (
          <DialogFooter
            className={cn('tw-p-6 tw-border-0 sm:tw-justify-between sm:tw-items-center', classes?.dialogFooter)}
          >
            <Button variant="outline" size="default" {...cancelBtnPropsRest}>
              {cancelBtnLabel ?? 'Cancel'}
            </Button>

            <SubmitActions actions={submitActions} />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmitActions({ actions }: { actions: ActionDialogSubmitAction[] }) {
  const buttons = actions.map(({ label, variant = 'primary', size = 'default', ...rest }, i) => (
    <Button key={i} variant={variant} size={size} {...rest}>
      {label}
    </Button>
  ));

  if (buttons.length === 1) return buttons[0];

  return <div className="tw-flex tw-items-center tw-gap-2">{buttons}</div>;
}
