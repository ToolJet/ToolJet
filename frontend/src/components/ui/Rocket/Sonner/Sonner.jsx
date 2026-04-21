import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved
import { Toaster as SonnerToaster, toast } from 'sonner';
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Toaster ─────────────────────────────────────────────────────────────────
// Place once in the app root. All toast() calls will render here.

const toastIcons = {
  success: <CircleCheckIcon className="tw-size-5" />,
  info: <InfoIcon className="tw-size-5" />,
  warning: <TriangleAlertIcon className="tw-size-5" />,
  error: <OctagonXIcon className="tw-size-5" />,
  loading: <Loader2Icon className="tw-size-5 tw-animate-spin" />,
  close: <X className="tw-size-4" />,
};

const toastClassNames = {
  toast: cn(
    // Layout
    'tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2.5 tw-pr-10 tw-w-[var(--width)]',
    // Visual
    'tw-bg-background-surface-layer-01',
    'tw-border-solid tw-border tw-border-border-weak',
    'tw-shadow-elevation-300',
    'tw-rounded-md'
  ),
  title: 'tw-font-title-large tw-text-text-default',
  description: 'tw-font-body-default tw-text-text-default',
  content: 'tw-flex tw-flex-col tw-gap-0.5',
  icon: 'tw-flex tw-items-center tw-justify-center tw-shrink-0',
  closeButton: cn(
    'tw-absolute tw-right-2 tw-flex tw-items-center tw-justify-center tw-shrink-0 tw-ml-auto',
    'tw-size-6 tw-rounded-md tw-border-0 tw-bg-transparent tw-cursor-pointer',
    'tw-text-icon-default hover:tw-bg-interactive-hover hover:tw-text-icon-strong',
    'tw-transition-colors'
  ),
  actionButton: cn(
    'tw-font-title-default tw-ml-auto tw-shrink-0',
    'tw-rounded-md tw-px-2 tw-h-6 tw-border-0 tw-cursor-pointer',
    'tw-bg-transparent tw-text-text-brand hover:tw-bg-interactive-hover',
    'tw-transition-colors'
  ),
};

function Toaster({
  position = 'top-center',
  closeButton = true,
  richColors = true,
  duration = 4000,
  className,
  ...props
}) {
  return (
    <SonnerToaster
      position={position}
      closeButton={closeButton}
      richColors={richColors}
      duration={duration}
      icons={toastIcons}
      className={cn('tw-toaster tw-group', className)}
      toastOptions={{
        unstyled: true,
        classNames: toastClassNames,
      }}
      {...props}
    />
  );
}
Toaster.displayName = 'Toaster';
Toaster.propTypes = {
  position: PropTypes.string,
  closeButton: PropTypes.bool,
  richColors: PropTypes.bool,
  duration: PropTypes.number,
  className: PropTypes.string,
};

// ── Exports ─────────────────────────────────────────────────────────────────

export { Toaster, toast };
