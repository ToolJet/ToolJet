// Types for the Combobox.jsx exports used in TS, which it can't infer from its untyped components.
// Delete this file once Combobox is converted to TypeScript.
import type { ComponentType, ReactNode } from 'react';

interface ComboboxProps<Item> {
  items: Item[];
  value?: Item | null;
  itemToStringLabel?: (item: Item) => string;
  onValueChange?: (item: Item | null) => void;
  children?: ReactNode;
  [prop: string]: unknown;
}

export const Combobox: <Item>(props: ComboboxProps<Item>) => ReactNode;
export const ComboboxInput: ComponentType<{ placeholder?: string; className?: string; [prop: string]: unknown }>;
export const ComboboxContent: ComponentType<{
  positionerClassName?: string;
  className?: string;
  children?: ReactNode;
  [prop: string]: unknown;
}>;
export const ComboboxList: ComponentType<{ children?: ReactNode | ((item: any) => ReactNode); className?: string }>;
export const ComboboxItem: ComponentType<{
  value: unknown;
  children?: ReactNode;
  className?: string;
  [prop: string]: unknown;
}>;
