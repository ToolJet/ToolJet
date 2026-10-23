// Types for Tabs.jsx, which TS can't infer from its untyped forwardRef callbacks.
// Delete this file once Tabs is converted to TypeScript.
import type { FC, ForwardRefExoticComponent, ReactElement, RefAttributes } from 'react';
import type {
  TabsContentProps as RadixTabsContentProps,
  TabsListProps as RadixTabsListProps,
  TabsProps,
  TabsTriggerProps as RadixTabsTriggerProps,
} from '@radix-ui/react-tabs';

type TabsVariant = 'underline' | 'underline-inverted';
type TabsSize = 'large' | 'default' | 'small';

export interface TabsListProps extends RadixTabsListProps {
  variant?: TabsVariant;
}

export interface TabsTriggerProps extends RadixTabsTriggerProps {
  size?: TabsSize;
  /** Decorative icon element before the label; coloured by tab state. */
  leadingVisual?: ReactElement;
}

export type TabsContentProps = RadixTabsContentProps;

export declare const Tabs: FC<TabsProps>;
export declare const TabsList: ForwardRefExoticComponent<TabsListProps & RefAttributes<HTMLDivElement>>;
export declare const TabsTrigger: ForwardRefExoticComponent<TabsTriggerProps & RefAttributes<HTMLButtonElement>>;
export declare const TabsContent: ForwardRefExoticComponent<TabsContentProps & RefAttributes<HTMLDivElement>>;

export declare function tabsListVariants(props?: { variant?: TabsVariant | null; className?: string }): string;
export declare function tabsTriggerVariants(props?: {
  size?: TabsSize | null;
  variant?: TabsVariant | null;
  className?: string;
}): string;
export declare const tabsContentClasses: string;
