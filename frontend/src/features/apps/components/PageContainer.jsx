import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const PageContainer = forwardRef(({ className, children, footer, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('tw-flex tw-flex-col tw-h-full tw-overflow-y-auto', className)} {...props}>
      {/* Main content area */}
      <div className="tw-flex-1 tw-overflow-auto tw-px-20 tw-pt-10">
        <div className="tw-w-full tw-max-w-[1232px] tw-mx-auto">{children}</div>
      </div>

      {/* Sticky footer */}
      {footer && (
        <div className="tw-sticky tw-bottom-0 tw-bg-background-surface-layer-01 tw-border-t tw-border-border-weak">
          <div className="tw-px-20">
            <div className="tw-w-full tw-max-w-[1232px] tw-mx-auto">{footer}</div>
          </div>
        </div>
      )}
    </div>
  );
});

PageContainer.displayName = 'PageContainer';

PageContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  footer: PropTypes.node,
};

PageContainer.defaultProps = {
  className: '',
  footer: null,
};

export { PageContainer };
