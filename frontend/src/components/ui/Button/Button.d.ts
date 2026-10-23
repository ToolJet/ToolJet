// Types for Button.jsx, which TS can't infer from its untyped forwardRef callback.
// Delete this file once Button is converted to TypeScript.
import type { ButtonHTMLAttributes, ElementType, ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghostBrand' | 'dangerPrimary' | 'dangerSecondary';
type ButtonSize = 'large' | 'default' | 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** SolidIcon name, or a Lucide icon name when `isLucid` is set. */
  leadingIcon?: string;
  trailingIcon?: string;
  isLucid?: boolean;
  iconOnly?: boolean;
  isLoading?: boolean;
  loaderText?: ReactNode;
  /** Overrides the variant's default icon color. */
  fill?: string;
  asChild?: boolean;
  component?: ElementType;
}

export declare const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;

export declare function buttonVariants(props?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  iconOnly?: boolean | null;
  className?: string;
}): string;
