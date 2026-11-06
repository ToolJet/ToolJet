import React, { forwardRef, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/Rocket/Button/Button';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  type InputGroupInputProps,
} from '@/components/ui/Rocket/InputGroup/InputGroup';

// Figma: Rocket-atoms › dialog/action (node 11874:249)

type DialogActionSize = 'small' | 'default' | 'large';

type DialogHeaderAction = Omit<ButtonProps, 'variant' | 'size' | 'iconOnly' | 'children'> & {
  icon: ReactNode;
  'aria-label': string;
};

interface DialogActionProps
  extends
    Pick<DialogProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'modal'>,
    Omit<DialogContentProps, 'title' | 'size'> {
  size?: DialogActionSize;
  /** `fit` hugs content (min 200px, max the size's height); `scroll` fixes the height and scrolls the body. */
  overflow?: 'fit' | 'scroll';
  title: ReactNode;
  description?: ReactNode;
  /** Icon button rendered before the close button. */
  headerAction?: DialogHeaderAction;
  /** Renders a search field below the title. */
  search?: InputGroupInputProps;
  /** Closes the dialog after its own `onClick`. */
  cancelAction?: Omit<DialogFooterAction, 'label'> & { label?: ReactNode };
  secondaryAction?: DialogFooterAction;
  primaryAction?: DialogFooterAction;
}

const MAX_HEIGHTS: Record<DialogActionSize, string> = {
  small: 'tw-max-h-[400px]',
  default: 'tw-max-h-[480px]',
  large: 'tw-max-h-[640px]',
};

const DialogAction = forwardRef<HTMLDivElement, DialogActionProps>(function DialogAction(
  {
    open,
    defaultOpen,
    onOpenChange,
    modal,
    className,
    size = 'default',
    overflow = 'fit',
    title,
    description,
    headerAction,
    search,
    showCloseButton = true,
    cancelAction,
    secondaryAction,
    primaryAction,
    children,
    ...props
  },
  ref
) {
  const scroll = overflow === 'scroll';
  const hasFooter = cancelAction || secondaryAction || primaryAction;

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <DialogContent
        ref={ref}
        data-slot="dialog-action"
        size={size}
        showCloseButton={false}
        // Radix warns about a missing description unless aria-describedby is explicitly unset
        {...(!description && { 'aria-describedby': undefined })}
        className={cn(
          'tw-overflow-hidden tw-border-0',
          MAX_HEIGHTS[size],
          // h-full resolves against the viewport, so max-h caps it at the size's fixed height
          scroll ? 'tw-h-full' : 'tw-min-h-[200px]',
          className
        )}
        {...props}
      >
        <DialogHeader className="tw-flex-col tw-items-stretch tw-gap-3 tw-h-auto tw-px-4 tw-py-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-0.5 tw-min-w-0 tw-break-words">
              <DialogTitle className="tw-font-title-heavy-large">{title}</DialogTitle>
              {description && (
                <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-medium">
                  {description}
                </DialogDescription>
              )}
            </div>

            {(headerAction || showCloseButton) && (
              <div className="tw-flex tw-items-center tw-gap-1">
                {headerAction && <HeaderActionButton {...headerAction} />}
                {showCloseButton && (
                  <DialogClose asChild>
                    <HeaderActionButton icon={<X />} aria-label="Close" />
                  </DialogClose>
                )}
              </div>
            )}
          </div>

          {search && (
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput {...search} />
            </InputGroup>
          )}
        </DialogHeader>

        <DialogBody className="tw-p-4 tw-overflow-y-auto">{children}</DialogBody>

        {hasFooter && (
          <DialogFooter
            className={cn('tw-justify-end tw-px-4 tw-py-3', scroll ? 'tw-border-border-weak' : 'tw-border-transparent')}
          >
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
            {secondaryAction && <DialogFooterButton variant="secondary" {...secondaryAction} />}
            {primaryAction && <DialogFooterButton variant="primary" {...primaryAction} />}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

DialogAction.displayName = 'DialogAction';

// forwardRef so DialogClose's asChild Slot can attach its ref and click handler.
const HeaderActionButton = forwardRef<HTMLButtonElement, DialogHeaderAction>(function HeaderActionButton(
  { icon, ...props },
  ref
) {
  return (
    <Button ref={ref} variant="ghost" size="medium" iconOnly {...props}>
      {icon}
    </Button>
  );
});

export default DialogAction;
export type { DialogActionProps, DialogHeaderAction, DialogActionSize };
