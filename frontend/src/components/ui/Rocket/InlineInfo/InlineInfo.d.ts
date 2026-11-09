import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export interface InlineInfoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  type?: 'info' | 'warning' | 'danger';
  variant?: 'ghost' | 'secondary' | 'outline' | 'filled';
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export const InlineInfo: ForwardRefExoticComponent<InlineInfoProps & RefAttributes<HTMLDivElement>>;
export function inlineInfoVariants(props?: Pick<InlineInfoProps, 'type' | 'variant'> & { className?: string }): string;
