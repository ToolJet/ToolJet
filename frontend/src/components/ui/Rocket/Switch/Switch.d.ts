import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as SwitchPrimitive from '@radix-ui/react-switch';

export const Switch: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & RefAttributes<ElementRef<typeof SwitchPrimitive.Root>>
>;
export const switchClasses: string[];
