import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as SelectPrimitive from '@radix-ui/react-select';

export const Select: typeof SelectPrimitive.Root;
export const SelectValue: typeof SelectPrimitive.Value;
export const SelectItemText: typeof SelectPrimitive.ItemText;

export type SelectSize = 'large' | 'default' | 'small';

export const SelectTrigger: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: SelectSize;
    showArrow?: boolean;
  } & RefAttributes<ElementRef<typeof SelectPrimitive.Trigger>>
>;
export const SelectContent: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & RefAttributes<ElementRef<typeof SelectPrimitive.Content>>
>;
export const SelectItem: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    showCheckIcon?: boolean;
  } & RefAttributes<ElementRef<typeof SelectPrimitive.Item>>
>;
