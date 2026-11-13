import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as CheckboxPrimitive from '@radix-ui/react-checkbox';

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: 'large' | 'default';
}

export const Checkbox: ForwardRefExoticComponent<
  CheckboxProps & RefAttributes<ElementRef<typeof CheckboxPrimitive.Root>>
>;
export function checkboxVariants(props?: { size?: 'large' | 'default'; className?: string }): string;
