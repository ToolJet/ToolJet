import type { ReactNode } from 'react';

export interface ConfirmDialogProps {
  show: boolean;
  title?: string;
  message?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonLoading?: boolean;
  darkMode?: boolean;
  confirmButtonText?: string;
  confirmButtonType?: string;
  cancelButtonType?: string;
  cancelButtonText?: string;
  backdropClassName?: string;
  onCloseIconClick?: () => void;
  footerStyle?: Record<string, unknown>;
  confirmButtonIcon?: string;
  confirmButtonIconWidth?: string;
  confirmButtonIconFill?: string;
  confirmIcon?: ReactNode;
  staticBackdrop?: boolean;
  cancelButtonDisabled?: boolean;
  hideCloseIcon?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
