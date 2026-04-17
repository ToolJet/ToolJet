import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import { Toaster as Sonner } from 'sonner';
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react';

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="tw-toaster tw-group"
      icons={{
        success: <CircleCheckIcon className="tw-size-4" />,
        info: <InfoIcon className="tw-size-4" />,
        warning: <TriangleAlertIcon className="tw-size-4" />,
        error: <OctagonXIcon className="tw-size-4" />,
        loading: <Loader2Icon className="tw-size-4 tw-animate-spin" />,
      }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      }}
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
