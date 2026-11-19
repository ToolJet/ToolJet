import React from 'react';
import urlJoin from 'url-join';
import { isNil } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getHostURL } from '@/_helpers/routes';
import { Button } from '@/components/ui/Button/Button';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

import type { AppLaunchAction, AppItem } from '../dummyData/types';

type LaunchDisabledReason = NonNullable<AppLaunchAction>['reason'];

interface LaunchButtonProps {
  appDetails: AppItem;
  className?: string;
}

const DISABLED_REASON_TOOLTIPS: Record<NonNullable<LaunchDisabledReason>, string> = {
  not_released: 'App does not have a deployed version',
  maintenance: 'This app is under maintenance',
  no_released_access: 'You do not have permission to access released apps',
};

export default function LaunchButton({ appDetails, className }: LaunchButtonProps) {
  const { actions } = appDetails;

  const { t } = useTranslation();

  // Note: launch will received as null from backend for workflows, modules and stub apps, no need of separate check for those cases
  if (isNil(actions?.launch)) return null;

  const handleLaunch = () => {
    !actions.launch?.reason && window.open(urlJoin(getHostURL(), `/applications/${appDetails.slug}`));
  };

  if (actions.launch.enabled) {
    return (
      <Button isLucid variant="outline" size="medium" leadingIcon="play" className={className} onClick={handleLaunch}>
        Launch
      </Button>
    );
  }

  return (
    // A disabled button swallows pointer events, so the tooltip wraps it.
    <TooltipComp arrow isTooltipForInteractiveDisabledElement content={DISABLED_REASON_TOOLTIPS[actions.launch.reason]}>
      <Button
        isLucid
        variant="outline"
        size="medium"
        leadingIcon="play"
        className={className}
        disabled={!actions.launch.enabled}
      >
        {actions.launch.reason === 'maintenance'
          ? t('homePage.appCard.maintenance', 'Maintenance')
          : t('homePage.appCard.launch', 'Launch')}
      </Button>
    </TooltipComp>
  );
}
