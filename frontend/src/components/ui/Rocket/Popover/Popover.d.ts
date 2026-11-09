import type {
  ComponentPropsWithoutRef,
  ElementRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
} from 'react';
import type * as PopoverPrimitive from '@radix-ui/react-popover';

export const Popover: typeof PopoverPrimitive.Root;
export const PopoverTrigger: typeof PopoverPrimitive.Trigger;
export const PopoverContent: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & RefAttributes<ElementRef<typeof PopoverPrimitive.Content>>
>;
export function PopoverHeader(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export const PopoverTitle: ForwardRefExoticComponent<
  HTMLAttributes<HTMLHeadingElement> & RefAttributes<HTMLHeadingElement>
>;
export const PopoverDescription: ForwardRefExoticComponent<
  HTMLAttributes<HTMLParagraphElement> & RefAttributes<HTMLParagraphElement>
>;
