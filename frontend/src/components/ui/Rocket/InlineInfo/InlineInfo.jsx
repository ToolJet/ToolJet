import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert as ShadcnAlert } from '@/components/ui/Rocket/shadcn/alert';

const inlineInfoVariants = cva(
  'tw-flex tw-gap-1.5 tw-items-start',
  {
    variants: {
      variant: {
        ghost: '',
        secondary: 'tw-bg-interactive-default tw-p-3 tw-rounded-md',
        outline: 'tw-bg-background-surface-layer-01 tw-p-3 tw-rounded-md tw-shadow-elevation-100',
        filled: 'tw-p-3 tw-rounded-md',
      },
    },
    defaultVariants: { variant: 'ghost' },
  }
);

const filledBg = {
  info: 'tw-bg-background-accent-weak',
  warning: 'tw-bg-background-warning-weak',
  danger: 'tw-bg-background-error-weak',
};

const iconColorMap = {
  info: 'tw-text-icon-accent',
  warning: 'tw-text-icon-warning',
  danger: 'tw-text-icon-danger',
};

const defaultIcons = {
  info: AlertCircle,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

const InlineInfo = forwardRef(function InlineInfo(
  {
    className,
    type = 'info',
    variant = 'ghost',
    title,
    description,
    action,
    icon,
    ...props
  },
  ref
) {
  const IconComp = defaultIcons[type];
  const resolvedIcon = icon ?? <IconComp size={18} />;

  return (
    <ShadcnAlert
      ref={ref}
      className={cn(
        inlineInfoVariants({ variant }),
        variant === 'filled' && filledBg[type],
        className
      )}
      {...props}
    >
      <span className={cn('tw-shrink-0 tw-size-[18px]', iconColorMap[type])}>
        {resolvedIcon}
      </span>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-items-start">
        <div className="tw-flex tw-flex-col">
          {title && (
            <p className="tw-m-0 tw-text-base tw-leading-[18px] tw-font-medium tw-text-text-medium">
              {title}
            </p>
          )}
          {description && (
            <p className="tw-m-0 tw-text-base tw-leading-[18px] tw-text-text-placeholder">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </ShadcnAlert>
  );
});

InlineInfo.displayName = 'InlineInfo';

InlineInfo.propTypes = {
  type: PropTypes.oneOf(['info', 'warning', 'danger']),
  variant: PropTypes.oneOf(['ghost', 'secondary', 'outline', 'filled']),
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export { InlineInfo, inlineInfoVariants };
