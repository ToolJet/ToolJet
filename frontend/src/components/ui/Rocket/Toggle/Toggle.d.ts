import type { ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as TogglePrimitive from '@radix-ui/react-toggle';

export interface ToggleProps extends ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  variant?: 'ghost' | 'outline';
  size?: 'large' | 'default' | 'medium' | 'small';
  'data-cy'?: string;
}

export const Toggle: ForwardRefExoticComponent<ToggleProps & RefAttributes<HTMLButtonElement>>;
export const toggleVariants: (props?: { variant?: ToggleProps['variant']; size?: ToggleProps['size'] }) => string;
export const toggleBaseClasses: string[];
