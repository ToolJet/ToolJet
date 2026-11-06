// Types for InlineInfo.jsx, which TS can't infer from its untyped forwardRef callback.
// Delete this file once InlineInfo is converted to TypeScript.
import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export interface InlineInfoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  type?: 'info' | 'warning' | 'danger';
  variant?: 'ghost' | 'secondary' | 'outline' | 'filled';
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export declare const InlineInfo: ForwardRefExoticComponent<InlineInfoProps & RefAttributes<HTMLDivElement>>;
export declare function inlineInfoVariants(props?: { variant?: InlineInfoProps['variant'] }): string;
