import React, { ComponentType, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'ghostBrand'
  | 'dangerPrimary'
  | 'dangerSecondary';
type ButtonSize = 'large' | 'default' | 'medium' | 'small';

interface TjButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: string;
  trailingIcon?: string;
  isLoading?: boolean;
  isLucid?: boolean;
  iconOnly?: boolean;
  asChild?: boolean;
  fill?: string;
  loaderText?: ReactNode;
}

// These design-system components are plain JS (no prop types), so their forwardRef
// exports don't carry props through to TSX call sites without an explicit cast.
const TypedDialogContent = DialogContent as ComponentType<
  React.ComponentPropsWithoutRef<'div'> & { showCloseButton?: boolean }
>;
const TypedDialogHeader = DialogHeader as ComponentType<React.ComponentPropsWithoutRef<'div'>>;
const TypedDialogFooter = DialogFooter as ComponentType<React.ComponentPropsWithoutRef<'div'>>;
const TypedDialogTitle = DialogTitle as ComponentType<
  React.ComponentPropsWithoutRef<'h2'> & { 'data-cy'?: string }
>;
const TypedButton = Button as ComponentType<TjButtonProps>;

interface CancelBtnProps extends Omit<TjButtonProps, 'children'> {
  label?: ReactNode;
}

interface SubmitAction extends Omit<TjButtonProps, 'children'> {
  label: ReactNode;
}

interface ActionDialogClasses {
  dialogContent?: string;
  dialogBody?: string;
  dialogFooter?: string;
}

interface ActionDialogProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
  showCancelButton?: boolean;
  open: boolean;
  handleOpenChange: (open: boolean) => void;
  cancelBtnProps?: CancelBtnProps;
  submitActions: SubmitAction[];
  children: ReactNode;
  title?: ReactNode | null;
  classes?: ActionDialogClasses | null;
  modality?: boolean;
  hasFooter?: boolean;
}

export default function ActionDialog({
  open,
  handleOpenChange,
  cancelBtnProps,
  submitActions,
  children,
  title = null,
  classes = null,
  modality = true,
  hasFooter = true,
  showCancelButton = true,
  ...dialogBodyProps
}: ActionDialogProps) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { label: cancelBtnLabel, ...cancelBtnPropsRest } = cancelBtnProps ?? {};

  const DialogBody = Slot;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={modality}>
      <TypedDialogContent
        data-cy="modal-component"
        showCloseButton={false}
        className={cn(
          'tw-w-full tw-max-w-96 tw-p-0 tw-gap-0 tw-border-border-weak',
          { 'dark-theme theme-dark': darkMode },
          classes?.dialogContent
        )}
      >
        {title && (
          <TypedDialogHeader className="tw-border-b tw-border-border-weak tw-px-6 tw-py-4">
            <TypedDialogTitle
              className="tw-font-title-x-large tw-text-text-default"
              data-cy={`${generateCypressDataCy(String(title))}-title`}
            >
              {title}
            </TypedDialogTitle>
          </TypedDialogHeader>
        )}

        <DialogBody className={cn('tw-p-6', classes?.dialogBody)} {...dialogBodyProps}>
          {children}
        </DialogBody>

        {hasFooter && (
          <TypedDialogFooter
            className={cn('tw-p-6 tw-border-0 sm:tw-justify-between sm:tw-items-center', classes?.dialogFooter)}
          >
            {showCancelButton && (
              <TypedButton variant="outline" size="default" {...cancelBtnPropsRest}>
                {cancelBtnLabel ?? 'Cancel'}
              </TypedButton>
            )}

            <SubmitActions actions={submitActions} />
          </TypedDialogFooter>
        )}
      </TypedDialogContent>
    </Dialog>
  );
}

function SubmitActions({ actions }: { actions: SubmitAction[] }) {
  const buttons = actions.map(({ label, variant = 'primary', size = 'default', ...rest }, i) => (
    <TypedButton key={i} variant={variant} size={size} {...rest}>
      {label}
    </TypedButton>
  ));

  if (buttons.length === 1) return buttons[0];

  return <div className="tw-flex tw-items-center tw-gap-2">{buttons}</div>;
}