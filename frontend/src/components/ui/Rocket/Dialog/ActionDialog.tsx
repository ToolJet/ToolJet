import React, { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

export interface ActionDialogButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-cy'?: string;
}

export interface ActionDialogAction extends Omit<ButtonProps, 'children'> {
  label: ReactNode;
}

export interface ActionDialogClasses {
  dialogContent?: string;
  dialogHeader?: string;
  dialogTitle?: string;
  dialogBody?: string;
  dialogFooter?: string;
}

export interface ActionDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  handleOpenChange: (open: boolean) => void;
  /** Props of the Cancel button; `label` replaces its text. */
  cancelBtnProps?: ActionDialogButtonProps & { label?: ReactNode };
  submitActions?: ActionDialogAction[];
  title?: string | null;
  titleIcon?: ReactNode;
  classes?: ActionDialogClasses | null;
  modality?: boolean;
  hasFooter?: boolean;
  /** Content at the start of the footer, before the buttons. */
  footerStart?: ReactNode;
  showCloseButton?: boolean;
  showCancelButton?: boolean;
  /** Runs as the dialog closes; call `preventDefault()` and focus an element to choose where focus goes. */
  onCloseAutoFocus?: (event: Event) => void;
}

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
  footerStart = null,
  showCloseButton = false,
  showCancelButton = true,
  onCloseAutoFocus,
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
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          'tw-w-full tw-max-w-96 tw-p-0 tw-gap-0 tw-border-border-weak',
          { 'dark-theme theme-dark': darkMode },
          classes?.dialogContent
        )}
      >
        {title && (
          <DialogHeader
            className={cn(
              'tw-border-b tw-border-border-weak tw-px-6 tw-py-4 tw-justify-between',
              classes?.dialogHeader
            )}
          >
            <DialogTitle
              // tailwind-merge can't dedupe the custom font-title tokens, so a custom title font replaces the default one
              className={cn('tw-text-text-default', classes?.dialogTitle ?? 'tw-font-title-x-large')}
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
                aria-label="Close"
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
            {/* Pair with showCancelButton={false} and pass Cancel as a submit action to keep it beside the primary action. */}
            {footerStart}

            {showCancelButton && (
              <Button variant="outline" size="default" {...cancelBtnPropsRest}>
                {cancelBtnLabel ?? 'Cancel'}
              </Button>
            )}

            <SubmitActions actions={submitActions} />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmitActions({ actions }: { actions: ActionDialogAction[] }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2 tw-ml-auto">
      {actions.map(({ label, variant = 'primary', size = 'default', ...rest }, i) => (
        <Button key={i} variant={variant} size={size} {...rest}>
          {label}
        </Button>
      ))}
    </div>
  );
}
