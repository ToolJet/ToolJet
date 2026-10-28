import type { HTMLAttributes, ReactNode } from 'react';

import type { ButtonProps } from '@/components/ui/Button/Button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export interface ActionDialogButtonProps extends ButtonProps {
  label?: ReactNode;
  'data-cy'?: string;
}

export interface ActionDialogSubmitAction extends ButtonProps {
  label: ReactNode;
  'data-cy'?: string;
}

export interface ActionDialogClasses {
  dialogContent?: string;
  dialogBody?: string;
  dialogFooter?: string;
}

interface ActionDialogBaseProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  open: boolean;
  handleOpenChange?: (open: boolean) => void;
  title?: string | null;
  titleIcon?: ReactNode;
  classes?: ActionDialogClasses | null;
  modality?: boolean;
}

interface ActionDialogWithFooterProps extends ActionDialogBaseProps {
  hasFooter?: true;
  /** `label` replaces the default "Cancel" text; the rest goes to the button. */
  cancelBtnProps?: ActionDialogButtonProps;
  submitActions: ActionDialogSubmitAction[];
}

interface ActionDialogWithoutFooterProps extends ActionDialogBaseProps {
  hasFooter: false;
  cancelBtnProps?: never;
  submitActions?: never;
}

// Remaining props are forwarded to the dialog body.
export type ActionDialogProps = ActionDialogWithFooterProps | ActionDialogWithoutFooterProps;
