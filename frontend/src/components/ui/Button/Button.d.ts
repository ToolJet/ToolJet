import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghostBrand' | 'dangerPrimary' | 'dangerSecondary';
  size?: 'large' | 'default' | 'medium' | 'small';
  /** Name of the icon shown before the label: a SolidIcon name, or a Lucide name with `isLucid`. */
  leadingIcon?: string;
  trailingIcon?: string;
  isLoading?: boolean;
  loaderText?: string | null;
  asChild?: boolean;
  fill?: string;
  iconOnly?: boolean;
  /** Reads `leadingIcon` and `trailingIcon` as Lucide names instead of SolidIcon names. */
  isLucid?: boolean;
  component?: 'button' | 'a';
  'data-cy'?: string;
}

export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
export function buttonVariants(
  props?: Pick<ButtonProps, 'variant' | 'size' | 'iconOnly'> & { className?: string }
): string;
