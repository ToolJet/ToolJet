import type * as React from 'react';
import type {
  ComponentPropsWithoutRef,
  ElementRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
} from 'react';
import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

type Part<Primitive extends React.ElementType, Extra = object> = ForwardRefExoticComponent<
  ComponentPropsWithoutRef<Primitive> & Extra & RefAttributes<ElementRef<Primitive>>
>;

export const DropdownMenu: typeof DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger: typeof DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup: typeof DropdownMenuPrimitive.Group;
export const DropdownMenuPortal: typeof DropdownMenuPrimitive.Portal;
export const DropdownMenuSub: typeof DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup: typeof DropdownMenuPrimitive.RadioGroup;
export const DropdownMenuContent: Part<typeof DropdownMenuPrimitive.Content>;
export const DropdownMenuItem: Part<typeof DropdownMenuPrimitive.Item, { inset?: boolean; destructive?: boolean }>;
export const DropdownMenuCheckboxItem: Part<typeof DropdownMenuPrimitive.CheckboxItem>;
export const DropdownMenuRadioItem: Part<typeof DropdownMenuPrimitive.RadioItem>;
export const DropdownMenuLabel: Part<typeof DropdownMenuPrimitive.Label, { inset?: boolean }>;
export const DropdownMenuSeparator: Part<typeof DropdownMenuPrimitive.Separator>;
export const DropdownMenuSubTrigger: Part<typeof DropdownMenuPrimitive.SubTrigger, { inset?: boolean }>;
export const DropdownMenuSubContent: Part<typeof DropdownMenuPrimitive.SubContent>;
export function DropdownMenuShortcut(props: HTMLAttributes<HTMLSpanElement>): JSX.Element;
