import React from 'react';
import { cn } from './cn';

/** One line of text that ends in an ellipsis when it is wider than its room; the whole text is then its tooltip (set on
 *  hover, and only when cut). A long label in a button, a badge or a picker ran past its widget's box. */
export const Truncate = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span
    className={cn('tw-min-w-0 tw-truncate', className)}
    onPointerEnter={(e) => {
      const el = e.currentTarget;
      if (el.scrollWidth > el.clientWidth + 1) el.title = el.textContent;
      else el.removeAttribute('title');
    }}
  >
    {children}
  </span>
);

/** Plain text children in a Truncate, so a flex box (a button, a badge) can end them in an ellipsis: a flex box clips
 *  its own text without one. Elements (icons, spans) are left as they are. */
export const truncateText = (children: React.ReactNode) =>
  React.Children.map(children, (child) =>
    (typeof child === 'string' && child.trim()) || typeof child === 'number' ? <Truncate>{child}</Truncate> : child
  );
