import React, { type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

// The short warning at the left of a drawer footer (Figma Drawer: footer start).
export function FooterNote({ children }: { children: ReactNode }) {
  return (
    <>
      <TriangleAlert className="tw-size-3.5 tw-shrink-0 tw-text-icon-accent" aria-hidden />
      <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">{children}</p>
    </>
  );
}
