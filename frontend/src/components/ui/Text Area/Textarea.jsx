import * as React from 'react';

import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

const Textarea = React.forwardRef(({ className, width = '300px', onValueChange, ...props }, ref) => {
  const textareaRef = useRef(null);
  const [height, setHeight] = useState('34px');

  const handleChange = (e) => {
    setHeight(`${Math.min(Math.max(textareaRef.current.scrollHeight + 1, 34), 88)}px`);
    onValueChange(e);
  };

  return (
    <textarea
      className={cn(
        'tw-flex tw-min-h-[34px] tw-max-h-[88px] tw-rounded-[8px] tw-text-text-default tw-font-normal tw-bg-background-surface-layer-01 tw-px-[8px] tw-py-[7px] tw-text-[12px]/[18px] tw-border-[1px] tw-border-solid tw-border-border-default hover:tw-border-border-strong placeholder:tw-text-text-placeholder focus-visible:tw-border-transparent focus-visible:tw-outline-none focus-visible:tw-ring-[1px] focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-offset-interactive-focus-outline disabled:tw-cursor-not-allowed disabled:tw-border-transparent disabled:tw-bg-[#CCD1D5]/30 transparent-scrollbar',
        className
      )}
      style={{
        height: height,
        width: width,
      }}
      onChange={handleChange}
      ref={textareaRef || ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
