import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export interface TruncatingTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The text; `children` is the alternative. */
  text?: ReactNode;
  children?: ReactNode;
  /** Replaces the automatic title, which only appears while the text is cut off. */
  title?: string;
  'data-cy'?: string;
}

export const TruncatingText: ForwardRefExoticComponent<TruncatingTextProps & RefAttributes<HTMLSpanElement>>;
