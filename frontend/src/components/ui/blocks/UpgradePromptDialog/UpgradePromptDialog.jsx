import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/Rocket/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button/Button';
import { Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpgradePromptDialog({
  open,
  onOpenChange,
  currentCount = 2,
  maxCount = 2,
  onUpgrade,
  hideBackdrop = false,
}) {
  const content = (
    <>
      {/* Header with Progress Indicator and Close Button */}
      <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
        {/* Progress Indicator */}
        <div
          className="tw-flex tw-items-center tw-justify-center tw-w-[72px] tw-h-[72px] tw-rounded-full tw-p-[6px]"
          style={{
            background: 'linear-gradient(97.66deg, #FCA23F 0.23%, #FC5F70 53.47%, #8E4EC6 100%)',
          }}
        >
          <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-rounded-full tw-bg-white">
            <p className="tw-text-center">
              <span className="tw-font-title-heavy-x-large" style={{ color: 'var(--upgrade-default, #FFAF41)' }}>
                {currentCount}
              </span>
              <span className="tw-font-body-small" style={{ color: 'var(--text-placeholder, #6A727C)' }}>
                /{maxCount}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <DialogHeader className="tw-gap-0 tw-items-start tw-p-0">
        <DialogTitle
          className="tw-font-title-x-large tw-text-left tw-m-0"
          style={{ color: 'var(--text-default, #1B1F24)' }}
        >
          You&apos;re building like a pro!
        </DialogTitle>
        <DialogDescription
          className="tw-font-body-large tw-text-left tw-my-0"
          style={{ color: 'var(--text-placeholder, #6A727C)' }}
        >
          You&apos;ve created {currentCount} awesome apps on your free plan. Upgrade to Pro to keep the creative
          momentum going and unlock advanced features!
        </DialogDescription>

        {/* Upgrade Button */}
        <div className="tw-w-full tw-pt-2">
          <Button variant="outline" size="default" isLucid={true} onClick={onUpgrade}>
            <Crown width={14} height={14} className="tw-text-background-premium" />
            Upgrade
          </Button>
        </div>
      </DialogHeader>
    </>
  );

  // If open/onOpenChange are provided, wrap in Dialog for controlled usage
  if (open !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          {!hideBackdrop && (
            <DialogPrimitive.Overlay className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black/80 data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0" />
          )}
          <DialogPrimitive.Content
            className={cn(
              'tw-fixed tw-left-[50%] tw-bottom-6 tw-z-50 tw-grid tw-w-full tw-max-w-[441px] tw-translate-x-[-50%] tw-gap-4 tw-border tw-bg-background tw-p-4 tw-shadow-lg tw-rounded-[14px] tw-duration-200 data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-slide-out-to-bottom-4 data-[state=open]:tw-slide-in-from-bottom-4'
            )}
          >
            {content}
            <DialogPrimitive.Close className="tw-absolute tw-right-4 tw-top-4 tw-rounded-sm tw-opacity-70 tw-ring-offset-background tw-transition-opacity hover:tw-opacity-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-ring focus:tw-ring-offset-2 disabled:tw-pointer-events-none data-[state=open]:tw-bg-accent data-[state=open]:tw-text-muted-foreground">
              <X className="tw-h-4 tw-w-4" />
              <span className="tw-sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    );
  }

  // Otherwise, return just the content for use with DialogTrigger
  return <DialogContent className="tw-max-w-[441px] tw-rounded-[14px] tw-p-4 tw-gap-4">{content}</DialogContent>;
}

UpgradePromptDialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  currentCount: PropTypes.number,
  maxCount: PropTypes.number,
  onUpgrade: PropTypes.func,
  hideBackdrop: PropTypes.bool,
};

UpgradePromptDialog.defaultProps = {
  currentCount: 2,
  maxCount: 2,
};
