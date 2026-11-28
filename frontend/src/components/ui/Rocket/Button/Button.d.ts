import type { ButtonHTMLAttributes, ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghostBrand' | 'outline';
export type ButtonSize = 'large' | 'default' | 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  danger?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  asChild?: boolean;
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  'data-cy'?: string;
}

export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
export function buttonVariants(
  props?: Pick<ButtonProps, 'variant' | 'size' | 'danger' | 'iconOnly'> & { className?: string }
): string;
