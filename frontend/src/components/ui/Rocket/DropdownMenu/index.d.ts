// Types for index.jsx, which TS infers with every destructured prop required.
// Delete this file once the DropdownMenu wrapper is converted to TypeScript.
import type { ReactElement, ReactNode } from 'react';
import type {
  DropdownMenuCheckboxItemProps,
  DropdownMenuItemProps,
  DropdownMenuRadioItemProps,
} from '@radix-ui/react-dropdown-menu';

interface BaseItem {
  id?: string;
  label: ReactNode;
  /** Wraps the rendered item, e.g. in a tooltip. */
  wrapper?: (item: ReactElement) => ReactNode;
  [dataAttribute: `data-${string}`]: string | undefined;
}

export interface DropdownMenuActionItem extends BaseItem, Omit<DropdownMenuItemProps, 'children'> {
  type?: undefined;
  icon?: ReactNode;
  destructive?: boolean;
  /**
   * Renders the item's content; `children` is the default icon + label.
   * With `asChild`, the returned element becomes the item (e.g. a router `Link`), so it must be a single
   * element that forwards its ref and props. Without it, links or buttons in the output end up nested
   * inside the menu item, where Enter clicks the item instead of them.
   */
  render?: (props: { children: ReactNode }) => ReactNode;
}

export interface DropdownMenuCheckboxOption extends BaseItem, Omit<DropdownMenuCheckboxItemProps, 'children'> {
  type: 'checkbox';
  /** Keeps the menu open after toggling, so several options can be changed in one go. */
  keepOpen?: boolean;
}

export interface DropdownMenuRadioOption extends Omit<DropdownMenuRadioItemProps, 'children'> {
  label: ReactNode;
}

interface ItemsSection {
  id?: string;
  label?: ReactNode;
  type?: undefined;
  items: Array<DropdownMenuActionItem | DropdownMenuCheckboxOption>;
}

interface RadioSection {
  id?: string;
  label?: ReactNode;
  type: 'radio';
  value: string;
  onValueChange: (value: string) => void;
  items: DropdownMenuRadioOption[];
}

/** Renders `content` as-is, e.g. a custom header. */
interface ContentSection {
  id?: string;
  content: ReactNode;
}

export type DropdownMenuSection = ItemsSection | RadioSection | ContentSection;

export interface DropdownMenuCompProps {
  /** Must be a single element that forwards its ref; it becomes the trigger via `asChild`. */
  trigger: ReactElement;
  sections?: DropdownMenuSection[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  classes?: { content?: string; group?: string; item?: string };
}

declare function DropdownMenuComp(props: DropdownMenuCompProps): ReactElement;

export default DropdownMenuComp;
