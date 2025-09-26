import * as React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '../Alert/Alert';

// Icon color variants based on type
const getIconColor = (type) => {
  switch (type) {
    case 'info':
      return 'tw-text-icon-brand';
    case 'warning':
      return 'tw-text-icon-warning';
    case 'danger':
      return 'tw-text-icon-danger';
    default:
      return 'tw-text-icon-brand';
  }
};

// Compound component that accepts title, icon, description, and button props
const InlineInfoCompound = React.forwardRef(
  ({ className, type = 'info', background = 'none', title, icon: Icon, description, button, ...props }, ref) => (
    <Alert ref={ref} type={type} background={background} className={className} {...props}>
      {Icon && (
        <div className="tw-shrink-0 tw-w-[18px] tw-h-[18px]">
          <Icon className={cn('tw-w-full tw-h-full', getIconColor(type))} />
        </div>
      )}
      <div className="tw-flex tw-flex-col tw-gap-2 tw-items-start">
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
        {button && <div className="tw-mt-1">{button}</div>}
      </div>
    </Alert>
  )
);
InlineInfoCompound.displayName = 'InlineInfoCompound';

export { InlineInfoCompound };
