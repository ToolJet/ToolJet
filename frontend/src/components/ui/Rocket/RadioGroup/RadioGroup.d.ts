import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

export interface RadioGroupItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  size?: 'large' | 'default';
}

export const RadioGroup: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & RefAttributes<ElementRef<typeof RadioGroupPrimitive.Root>>
>;
export const RadioGroupItem: ForwardRefExoticComponent<
  RadioGroupItemProps & RefAttributes<ElementRef<typeof RadioGroupPrimitive.Item>>
>;
export function radioGroupItemVariants(props?: { size?: RadioGroupItemProps['size']; className?: string }): string;
