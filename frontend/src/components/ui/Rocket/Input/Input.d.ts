import type { ForwardRefExoticComponent, InputHTMLAttributes, RefAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'large' | 'default' | 'small';
  'data-cy'?: string;
}

export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
export function inputVariants(props?: { size?: InputProps['size']; className?: string }): string;
