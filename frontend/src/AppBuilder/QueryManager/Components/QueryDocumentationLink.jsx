import React from 'react';
import { BookOpen } from 'lucide-react';
import { ToolTip } from '@/_components';

export const QueryDocumentationLink = ({ href, label, tooltipClassName, tooltipPlacement }) => (
  <ToolTip
    message={label}
    placement={tooltipPlacement}
    trigger={['hover', 'focus']}
    show={true}
    tooltipClassName={tooltipClassName}
  >
    <a
      className="query-documentation-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
    >
      <BookOpen size={15} strokeWidth={1.75} aria-hidden="true" />
    </a>
  </ToolTip>
);
