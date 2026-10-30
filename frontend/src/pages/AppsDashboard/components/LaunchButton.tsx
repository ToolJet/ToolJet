import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

import type { AppLaunchAction } from '../dummyData/types';

type LaunchDisabledReason = NonNullable<AppLaunchAction>['reason'];

interface LaunchButtonProps {
  /** `null` means the viewer can't launch this app at all, so nothing is rendered. */
  launch: AppLaunchAction;
  onLaunch?: () => void;
  className?: string;
}

const DISABLED_REASON_TOOLTIPS: Record<NonNullable<LaunchDisabledReason>, string> = {
  not_released: 'This app has not been released yet',
  maintenance: 'This app is under maintenance',
  no_released_access: "You don't have access to the released version",
};

export default function LaunchButton({ launch, onLaunch, className }: LaunchButtonProps) {
  if (!launch) return null;

  if (launch.enabled) {
    return (
      <Button isLucid variant="outline" size="medium" leadingIcon="play" className={className} onClick={onLaunch}>
        Launch
      </Button>
    );
  }

  return (
    // A disabled button swallows pointer events, so the tooltip wraps it.
    <TooltipComp arrow isTooltipForInteractiveDisabledElement content={DISABLED_REASON_TOOLTIPS[launch.reason]}>
      <Button isLucid disabled variant="outline" size="medium" leadingIcon="play" className={className}>
        {launch.reason === 'maintenance' ? 'Maintenance' : 'Launch'}
      </Button>
    </TooltipComp>
  );
}
