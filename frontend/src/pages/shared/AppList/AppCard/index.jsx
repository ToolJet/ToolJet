import React, { useMemo } from 'react';
import moment from 'moment';
import urlJoin from 'url-join';
import queryString from 'query-string';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { getPrivateRoute, getSubpath } from '@/_helpers/routes';
import { authenticationService } from '@/_services/authentication.service';
import { decodeEntities, hasBuilderRole } from '@/_helpers/utils';
import { getEnvironmentAccessFromPermissions, getDefaultEnvironment } from '@/_helpers/environmentAccess';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import TruncatedText from '../../TruncatedText';
import TooltipComp from '../../Tooltip';
import AppMenu from '../components/AppMenu';

import { appIconNameMappingForLucideIcon, isValidSlug } from './helper';

export default function AppCard({
  appDetails,
  appType,
  basicPlan,
  moduleEnabled,
  currentFolderId,
  onMenuItemClick,
  checkUserPermissions,
}) {
  const { t } = useTranslation();
  const { id, name, icon, editing_version, created_at, updated_at, slug, home_page_handle } = appDetails;

  const { hasCreatePermission, hasUpdatePermission, hasDeletePermission, hasViewPermission } = useMemo(
    () => checkUserPermissions(appDetails),
    [appDetails]
  );

  const session = authenticationService.currentSessionValue;
  const appPerms = session?.app_group_permissions;
  const environmentAccess = getEnvironmentAccessFromPermissions(appPerms, id);
  const hasNonReleasedAccess =
    environmentAccess.development || environmentAccess.staging || environmentAccess.production;

  const updatedAt = editing_version?.updated_at || updated_at;
  const formatedUpdatedAt = moment(updatedAt).fromNow(true);

  const isAppTypeModuleAndModuleNotEnabled = appType === 'module' && !moduleEnabled;

  const handleEditClick = () => {
    posthogHelper.captureEvent('click_edit_button_on_card', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
      app_id: id,
      folder_id: currentFolderId,
    });
  };

  const textBlock = (
    <div className="tw-flex tw-flex-col tw-gap-0.5 tw-overflow-hidden tw-w-full">
      {/* TODO: Font size to be changed later on based on design */}
      <TruncatedText
        content={name}
        data-cy={`${name?.toLowerCase().replace(/\s+/g, '-')}-title`}
        className="tw-flex-1 tw-text-text-default tw-font-title-default tw-m-0"
      >
        {decodeEntities(name)}
      </TruncatedText>

      {/* <p className="tw-m-0 tw-text-text-default tw-font-title-default tw-truncate">
        {name}
      </p> */}

      {hasUpdatePermission && (
        <TooltipComp content={created_at ? moment(created_at).format('dddd, MMMM Do YYYY, h:mm:ss a') : ''}>
          <p
            data-cy="app-creation-details"
            className="tw-m-0 tw-text-text-placeholder tw-font-body-default tw-truncate"
          >
            {`Edited ${formatedUpdatedAt} ${formatedUpdatedAt !== 'just now' ? 'ago' : ''}`}
          </p>
        </TooltipComp>
      )}
    </div>
  );

  const IconComponent = appIconNameMappingForLucideIcon[icon] ?? appIconNameMappingForLucideIcon.apps;

  return (
    <TooltipComp content={isAppTypeModuleAndModuleNotEnabled ? 'Modules are not available on your current plan.' : ''}>
      <div
        data-cy={`${name?.toLowerCase().replace(/\s+/g, '-')}-card`}
        className={cn(
          'tw-relative tw-h-[6.375rem] tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak tw-rounded-lg tw-cursor-pointer tw-transition-shadow tw-duration-200 hover:tw-shadow-[0px_0px_1px_0px_rgba(48,50,51,0.05),_0px_2px_4px_0px_rgba(48,50,51,0.1)]',
          { 'tw-opacity-50 tw-pointer-events-none': isAppTypeModuleAndModuleNotEnabled },
          { 'tw-group ': !isAppTypeModuleAndModuleNotEnabled }
        )}
      >
        {/* Rest state: icon at top, text below */}
        <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-gap-3 tw-opacity-100 group-hover:tw-opacity-0 tw-transition-opacity tw-duration-200 tw-pointer-events-auto group-hover:tw-pointer-events-none">
          <IconComponent
            size={20}
            className="tw-shrink-0"
            color="var(--icon-default)"
            data-cy={`app-card-${icon}-icon`}
          />

          {textBlock}
        </div>

        {/* Hover state: text at top, action buttons at bottom */}
        <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-pointer-events-none group-hover:tw-pointer-events-auto">
          {textBlock}

          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-w-full">
            {!hasUpdatePermission && hasViewPermission && appType !== 'module' && hasNonReleasedAccess && (
              <ViewBtn appId={id} appSlug={slug} homePageHandle={home_page_handle} basicPlan={basicPlan} />
            )}

            {appType !== 'module' && (
              <LaunchBtn
                appId={id}
                appSlug={slug}
                appType={appType}
                currentVersionId={appDetails.current_version_id}
                isMaintenanceOn={appDetails.is_maintenance_on}
              />
            )}

            <div className="tw-flex tw-items-center tw-gap-2">
              {(hasUpdatePermission || appType === 'module') && (
                <TooltipComp content={`Open in ${appType !== 'workflow' ? 'app builder' : 'workflow editor'}`}>
                  <Button
                    isLucid
                    size="medium"
                    variant="secondary"
                    leadingIcon="square-pen"
                    onClick={handleEditClick}
                    component={Link}
                    reloadDocument
                    to={getPrivateRoute('editor', {
                      slug: isValidSlug(slug) ? slug : id,
                    })}
                    data-cy="edit-button"
                    className="hover:tw-no-underline hover:tw-text-text-default"
                  >
                    {t('globals.edit', 'Edit')}
                  </Button>
                </TooltipComp>
              )}

              {(hasCreatePermission || hasDeletePermission || hasUpdatePermission || appType === 'module') && (
                <AppMenu
                  appType={appType}
                  appDetails={appDetails}
                  hasCreatePermission={hasCreatePermission}
                  hasUpdatePermission={hasUpdatePermission}
                  hasDeletePermission={hasDeletePermission}
                  onMenuItemClick={onMenuItemClick}
                  currentFolderId={currentFolderId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipComp>
  );
}

function ViewBtn({ appId, appSlug, homePageHandle, basicPlan }) {
  const { t } = useTranslation();

  const handlePreview = () => {
    const pageHandle = homePageHandle || 'home';
    const slugOrId = isValidSlug(appSlug) ? appSlug : appId;

    const session = authenticationService.currentSessionValue;
    const appPerms = session?.app_group_permissions;
    const environmentAccess = getEnvironmentAccessFromPermissions(appPerms, appId);

    // Check if user is a builder
    const isBuilder = appPerms?.is_all_editable || appPerms?.editable_apps_id?.includes(appId) || false;

    // For preview, use first available environment from user's actual permissions
    const defaultEnv = getDefaultEnvironment(environmentAccess, isBuilder, true);

    // Don't add env param if license is invalid or multi-environment feature is not available
    const queryParams = basicPlan ? {} : { env: defaultEnv };
    const previewQuery = queryString.stringify(queryParams);

    const previewUrl = `/applications/${slugOrId}/${pageHandle}${previewQuery ? `?${previewQuery}` : ''}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <Button isLucid size="medium" variant="primary" data-cy="preview-button" onClick={handlePreview}>
      {t('globals.preview', 'Preview')}
    </Button>
  );
}

function LaunchBtn({ appId, appSlug, appType, currentVersionId, isMaintenanceOn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const session = authenticationService.currentSessionValue;
  const appPerms = session?.app_group_permissions;
  const environmentAccess = getEnvironmentAccessFromPermissions(appPerms, appId);

  // Check if user is a builder based on role, not just editable apps
  const isBuilder = hasBuilderRole(session?.role ?? {});

  // End-users (non-builders) always have released app access
  // Builders need explicit canAccessReleased permission
  const canAccessReleased = !isBuilder || environmentAccess.released;

  const isDisabled = appType === 'workflow' ? true : currentVersionId === null || isMaintenanceOn || !canAccessReleased;

  const btnVarient = isDisabled ? 'ghost' : 'secondary';
  const btnLabel =
    appType !== 'workflow' && isMaintenanceOn
      ? t('homePage.appCard.maintenance', 'Maintenance')
      : t('homePage.appCard.launch', 'Launch');
  const tooltipContent =
    appType === 'workflow'
      ? t('homePage.appCard.launchingWorkflowNotAvailable', 'Launching workflows is not currently available')
      : appType === 'front-end'
      ? currentVersionId === null
        ? t('homePage.appCard.noDeployedVersion', 'App does not have a deployed version')
        : !canAccessReleased
        ? t('homePage.appCard.noReleasedAccess', 'You do not have permission to access released apps')
        : t('homePage.appCard.openInAppViewer', 'Open in app viewer')
      : '';

  const handleLaunch = () => {
    if (appType === 'workflow') return;

    if (currentVersionId && canAccessReleased) {
      window.open(urlJoin(window.public_config?.TOOLJET_HOST, getSubpath() ?? '', `/applications/${appSlug}`));
    } else {
      navigate(currentVersionId ? `/applications/${appSlug}` : '');
    }
  };

  return (
    <TooltipComp content={tooltipContent}>
      <Button
        isLucid
        size="medium"
        leadingIcon="play"
        data-cy="launch-button"
        variant={btnVarient}
        onClick={handleLaunch}
        disabled={isDisabled}
      >
        {btnLabel}
      </Button>
    </TooltipComp>
  );
}
