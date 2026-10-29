import type { HTMLAttributes, ReactNode } from 'react';

import type { ButtonProps } from '@/components/ui/Button/Button';

import type { TAppType } from '../helper';
import type { ItemKindWithDetails } from '../types';

interface DashboardCardBaseProps {
  /** Shown at rest; replaced by the action row on hover or focus. */
  icon: ReactNode;
  /** Left-aligned action; the rest of the row is right-aligned. */
  startAction?: ReactNode;
  endAction: ReactNode;
  appType: TAppType;
  pinned?: boolean;
  isUnsynced?: boolean;
}

export type DashboardCardProps = DashboardCardBaseProps & ItemKindWithDetails;

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
