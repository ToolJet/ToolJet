import type * as React from 'react';
import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Combobox as ComboboxPrimitive } from '@base-ui/react';

// Styled wrappers keep the Base UI props of the part they wrap.
type Part<Primitive extends React.ElementType, Extra = object> = ForwardRefExoticComponent<
  Omit<ComponentProps<Primitive>, 'ref'> & Extra & RefAttributes<HTMLElement>
>;

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>
): JSX.Element;
export const ComboboxInput: Part<typeof ComboboxPrimitive.Input, { size?: 'large' | 'default' | 'small' }>;
export const ComboboxContent: Part<
  typeof ComboboxPrimitive.Popup,
  {
    anchor?: unknown;
    positionerClassName?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    collisionPadding?: number;
  }
>;
export const ComboboxList: Part<typeof ComboboxPrimitive.List>;
export const ComboboxItem: Part<typeof ComboboxPrimitive.Item>;
export const ComboboxEmpty: Part<typeof ComboboxPrimitive.Empty>;
export const ComboboxTrigger: Part<typeof ComboboxPrimitive.Trigger>;
export const ComboboxLabel: Part<typeof ComboboxPrimitive.Label>;
export const ComboboxSeparator: Part<typeof ComboboxPrimitive.Separator>;
export const ComboboxValue: typeof ComboboxPrimitive.Value;
export const ComboboxGroup: typeof ComboboxPrimitive.Group;
export const ComboboxCollection: typeof ComboboxPrimitive.Collection;
export function comboboxInputVariants(props?: { size?: 'large' | 'default' | 'small'; className?: string }): string;
