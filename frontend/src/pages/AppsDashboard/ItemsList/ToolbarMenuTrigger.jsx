import React, { forwardRef } from 'react';

import { Button } from '@/components/ui/Button/Button';

// forwardRef + prop spreading let Radix's `asChild` trigger attach its ref, handlers and data-state.
const ToolbarMenuTrigger = forwardRef(function ToolbarMenuTrigger({ icon: Icon, label, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="medium"
      iconOnly
      aria-label={label}
      className="data-[state=open]:tw-bg-button-outline-pressed"
      {...props}
    >
      <Icon size={14} className="tw-text-icon-strong" />
    </Button>
  );
});

export default ToolbarMenuTrigger;
