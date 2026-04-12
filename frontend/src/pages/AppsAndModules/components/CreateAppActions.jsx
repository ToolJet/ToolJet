import React from 'react';
import { useTranslation } from 'react-i18next';

import TooltipComp from '@/components/ui/Rocket/Tooltip';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import BuildWithAIAssistant from '../components/BuildWithAIAssistant';
import CreateAppButton from '../../shared/components/CreateAppButton';
import MoreAppsActionMenu from '../../shared/components/MoreAppsActionMenu';
import ShimmerEffectSkeleton from '../../shared/components/ShimmerEffectSkeleton';

export default function CreateAppActions({
  appType,
  canCreateApp,
  isCreationDisabled,
  isWorkspaceBranchLocked,
  appsLimit,
  featureAccess,
  moduleEnabled,
  showLoadingSkeleton,
}) {
  const { t } = useTranslation();

  if (showLoadingSkeleton)
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <ShimmerEffectSkeleton className="tw-h-8 tw-w-28" />

        {appType === 'front-end' && <ShimmerEffectSkeleton className="tw-h-8 tw-w-28" />}

        <ShimmerEffectSkeleton className="tw-size-8" />
      </div>
    );

  if (appType === 'front-end') {
    return !appsLimit?.appsCount?.canAddUnlimited && appsLimit?.appsCount?.percentage >= 100 ? ( // Show license banner only when app limit is reached and unlimited apps cannot be added
      <LicenseBanner
        type="apps"
        size="small"
        showNewBanner
        bannerVariant="inline"
        limits={appsLimit?.appsCount ?? {}}
      />
    ) : (
      canCreateApp && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <CreateAppButton
            label={t('homePage.header.createNewApplication', 'Create new app')}
            appType={appType}
            disabled={isCreationDisabled}
            isWorkspaceBranchLocked={isWorkspaceBranchLocked}
          />

          <BuildWithAIAssistant isCreationDisabled={isCreationDisabled} />

          <MoreAppsActionMenu appType={appType} disabled={isCreationDisabled} featureAccess={featureAccess} />
        </div>
      )
    );
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <TooltipComp
        content={!moduleEnabled ? 'Modules are not available on your current plan.' : ''}
        isTooltipForInteractiveDisabledElement={isCreationDisabled}
      >
        <CreateAppButton
          label="Create new module"
          appType={appType}
          disabled={isCreationDisabled}
          isWorkspaceBranchLocked={isWorkspaceBranchLocked}
        />
      </TooltipComp>

      <MoreAppsActionMenu appType={appType} disabled={isCreationDisabled} />
    </div>
  );
}
