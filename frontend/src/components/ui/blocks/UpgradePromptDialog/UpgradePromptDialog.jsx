import * as React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button/Button';
import { Crown } from 'lucide-react';

export function UpgradePromptDialog({ open, onOpenChange, currentCount = 2, maxCount = 2, onUpgrade }) {
  const content = (
    <DialogContent className="tw-max-w-[441px] tw-rounded-[14px] tw-p-4 tw-gap-4">
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
    </DialogContent>
  );

  // If open/onOpenChange are provided, wrap in Dialog for controlled usage
  if (open !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {content}
      </Dialog>
    );
  }

  // Otherwise, return just the content for use with DialogTrigger
  return content;
}

UpgradePromptDialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  currentCount: PropTypes.number,
  maxCount: PropTypes.number,
  onUpgrade: PropTypes.func,
};

UpgradePromptDialog.defaultProps = {
  currentCount: 2,
  maxCount: 2,
};

