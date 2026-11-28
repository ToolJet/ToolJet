import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as TooltipPrimitive from '@radix-ui/react-tooltip';

export interface TooltipContentProps extends ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  showArrow?: boolean;
}

export const TooltipProvider: typeof TooltipPrimitive.Provider;
export const Tooltip: typeof TooltipPrimitive.Root;
export const TooltipTrigger: typeof TooltipPrimitive.Trigger;
export const TooltipContent: ForwardRefExoticComponent<
  TooltipContentProps & RefAttributes<ElementRef<typeof TooltipPrimitive.Content>>
>;
export const TooltipArrow: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow> & RefAttributes<ElementRef<typeof TooltipPrimitive.Arrow>>
>;
export const tooltipContentClasses: string;
