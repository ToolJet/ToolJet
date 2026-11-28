import type { ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import type * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

type Size = 'large' | 'default' | 'medium' | 'small';

export type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & { size?: Size };
export type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
  size?: Size;
  'data-cy'?: string;
};

export const ToggleGroup: ForwardRefExoticComponent<ToggleGroupProps & RefAttributes<HTMLDivElement>>;
export const ToggleGroupItem: ForwardRefExoticComponent<ToggleGroupItemProps & RefAttributes<HTMLButtonElement>>;
