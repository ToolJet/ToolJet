// Types for Button.jsx, which TS can't infer from its untyped forwardRef callback.
// Delete this file once Button is converted to TypeScript.
import type { ButtonHTMLAttributes, ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghostBrand';
type ButtonSize = 'large' | 'default' | 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Designed only for primary/secondary (and ghost when iconOnly). */
  danger?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  asChild?: boolean;
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
}

export declare const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;

export declare function buttonVariants(props?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  danger?: boolean | null;
  iconOnly?: boolean | null;
  className?: string;
}): string;
