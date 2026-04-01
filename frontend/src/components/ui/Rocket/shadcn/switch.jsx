import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef(({ className, thumbClassName, ...props }, ref) => {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      className={cn(className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(thumbClassName)}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = 'Switch';

export { Switch };
