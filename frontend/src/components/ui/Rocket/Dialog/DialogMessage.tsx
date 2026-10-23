import React, { forwardRef, type ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
  type DialogProps,
} from '@/components/ui/Rocket/Dialog/Dialog';
import DialogFooterButton, { type DialogFooterAction } from '@/components/ui/Rocket/Dialog/DialogFooterButton';

// Figma: Rocket-atoms › dialog/message (node 11889:277)

type DialogMessageType = 'info' | 'warning' | 'error';

// danger is derived from `type`
type DialogMessageAction = Omit<DialogFooterAction, 'danger'>;

interface DialogMessageProps
  extends
    Pick<DialogProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'modal'>,
    Omit<DialogContentProps, 'title' | 'size'> {
  type?: DialogMessageType;
  title: ReactNode;
  description?: ReactNode;
  /** Replaces the type's default icon; `null` hides it. */
  icon?: ReactNode;
  /** `fit` hugs content up to 240px; `scroll` fixes the slot at 240px. */
  overflow?: 'fit' | 'scroll';
  /** Closes the dialog after its own `onClick`. */
  cancelAction?: Omit<DialogMessageAction, 'label'> & { label?: ReactNode };
  secondaryAction?: DialogMessageAction;
  primaryAction?: DialogMessageAction;
}

const DEFAULT_ICONS: Record<DialogMessageType, ReactNode> = {
  info: <Info className="tw-text-icon-accent" />,
  warning: <TriangleAlert className="tw-text-icon-warning" />,
  error: <CircleAlert className="tw-text-icon-danger" />,
};

const DialogMessage = forwardRef<HTMLDivElement, DialogMessageProps>(function DialogMessage(
  {
    open,
    defaultOpen,
    onOpenChange,
    modal,
    className,
    type = 'info',
    title,
    description,
    icon = DEFAULT_ICONS[type],
    overflow = 'fit',
    showCloseButton = false,
    cancelAction,
    secondaryAction,
    primaryAction,
    children,
    ...props
  },
  ref
) {
  const danger = type === 'error';
  const hasFooter = cancelAction || secondaryAction || primaryAction;

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <DialogContent
        ref={ref}
        data-slot="dialog-message"
        showCloseButton={false}
        // Radix warns about a missing description unless aria-describedby is explicitly unset
        {...(!description && { 'aria-describedby': undefined })}
        className={cn('tw-max-w-[460px] tw-p-6 tw-gap-4 tw-border-0', className)}
        {...props}
      >
        <DialogHeader className="tw-flex-col tw-items-stretch tw-gap-4 tw-h-auto tw-p-0 tw-border-0">
          {(icon || showCloseButton) && (
            <div className="tw-flex tw-items-start">
              {icon && <span className="tw-flex [&_svg]:tw-size-10">{icon}</span>}
              {showCloseButton && (
                <DialogClose asChild>
                  <Button variant="ghost" size="medium" iconOnly aria-label="Close" className="tw-ml-auto">
                    <X />
                  </Button>
                </DialogClose>
              )}
            </div>
          )}

          <div className="tw-flex tw-flex-col tw-gap-0.5 tw-break-words">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-medium">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {children && (
          <DialogBody
            noPadding
            className={cn('tw-flex tw-flex-col tw-max-h-60 tw-overflow-y-auto', overflow === 'scroll' && 'tw-h-60')}
          >
            {children}
          </DialogBody>
        )}

        {hasFooter && (
          // Message dialogs have no footer divider, even when the body scrolls
          <DialogFooter className="tw-justify-end tw-p-0 tw-border-0">
            {cancelAction && (
              <DialogClose asChild>
                <DialogFooterButton
                  variant="outline"
                  className="tw-mr-auto"
                  {...cancelAction}
                  label={cancelAction.label ?? 'Cancel'}
                />
              </DialogClose>
            )}
            {secondaryAction && <DialogFooterButton variant="secondary" danger={danger} {...secondaryAction} />}
            {primaryAction && <DialogFooterButton variant="primary" danger={danger} {...primaryAction} />}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

DialogMessage.displayName = 'DialogMessage';

export default DialogMessage;
export type { DialogMessageProps, DialogMessageAction, DialogMessageType };
