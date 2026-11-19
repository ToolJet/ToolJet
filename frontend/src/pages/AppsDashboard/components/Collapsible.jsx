import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function Collapsible({ title, subTitle, children, classes = null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'tw-border tw-border-solid tw-border-border-weak tw-rounded-lg tw-overflow-hidden',
        classes?.collapsibleContainer
      )}
    >
      <div
        role="button"
        className={cn(
          'tw-flex tw-items-center tw-justify-between tw-gap-1 tw-w-full tw-px-4 tw-py-3',
          { 'tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-rounded-none': isExpanded },
          classes?.collapsibleTrigger
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div>
          <h6 className="tw-font-title-default tw-text-text-default tw-mb-0">{title}</h6>

          {Boolean(subTitle) && <span className="tw-font-body-default tw-text-text-placeholder">{subTitle}</span>}
        </div>

        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isExpanded && <div className={cn('tw-p-4', classes?.collapsibleContent)}>{children}</div>}
    </div>
  );
}
