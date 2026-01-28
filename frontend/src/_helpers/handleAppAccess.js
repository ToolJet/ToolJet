import { organizationService, authenticationService, appsService } from '@/_services';
import { safelyParseJSON } from '@/_helpers/utils';
import { getSubpath, getQueryParams, redirectToErrorPage } from '@/_helpers/routes';
import { getEnvironmentAccessFromPermissions, getSafeEnvironment } from '@/_helpers/environmentAccess';
import _ from 'lodash';
import queryString from 'query-string';
import { ERROR_TYPES } from './constants';

/*  appId, versionId are only for old preview URLs */
export const handleAppAccess = async (componentType, slug, version_id, environment_id) => {
  const isOldLocalPreview = version_id && environment_id ? true : false;
  const queryParams = getQueryParams();
  const hasQueryParams = queryParams['env'] || queryParams['version'];
  const isLocalPreview = hasQueryParams || isOldLocalPreview;

  const previewQueryParams = isLocalPreview || componentType === 'editor' ? getPreviewQueryParams(slug) : {};
  const apiQueryParams = {
    ...previewQueryParams,
    ...(isOldLocalPreview && { version_id, environment_id }),
    access_type: componentType === 'editor' ? 'edit' : 'view',
  };
  const query = queryString.stringify(previewQueryParams);
  const redirectPath = !_.isEmpty(query) ? `/applications/${slug}${query ? `?${query}` : ''}` : `/apps/${slug}`;

  if (componentType === 'editor' || isLocalPreview || isOldLocalPreview) {
    /* Editor or app preview */
    return appsService.validatePrivateApp(slug, apiQueryParams).catch((error) => {
      handleError(componentType, error, slug, redirectPath);
    });
  } else {
    /* Released app link [launch/sharable link] */
    try {
      return await appsService.validateReleasedApp(slug);
    } catch (errorResponse) {
      const editPermission = errorResponse?.error?.editPermission;
      handleError(componentType, errorResponse, redirectPath, editPermission, slug);
    }
  }
};

const switchOrganization = (componentType, orgId, redirectPath) => {
  const path = redirectPath;
  const sub_path = getSubpath() ?? '';
  organizationService.switchOrganization(orgId).then(
    () => {
      window.location.href = componentType === 'editor' ? `${sub_path}/${orgId}${path}` : `${sub_path}${path}`;
    },
    () => {
      return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
    }
  );
};

export const handleError = (componentType, error, redirectPath, editPermission, appSlug = null) => {
  try {
    if (error?.data) {
      const statusCode = error.data?.statusCode;
      switch (statusCode) {
        case 403: {
          const errorObj = safelyParseJSON(error.data?.message);
          const currentSessionValue = authenticationService.currentSessionValue;
          if (
            errorObj?.organizationId &&
            currentSessionValue.current_user &&
            currentSessionValue.current_organization_id !== errorObj?.organizationId
          ) {
            switchOrganization(componentType, errorObj?.organizationId, redirectPath);
            return;
          }
          if (error?.data?.message === ERROR_TYPES.NO_ACCESSIBLE_PAGES) {
            redirectToErrorPage(ERROR_TYPES.NO_ACCESSIBLE_PAGES);
            return;
          }
          if (error?.data?.message === ERROR_TYPES.RESTRICTED_PREVIEW) {
            redirectToErrorPage(ERROR_TYPES.RESTRICTED_PREVIEW);
            return;
          }
          redirectToErrorPage(ERROR_TYPES.RESTRICTED);
          return;
        }
        case 401: {
          const errorObj = safelyParseJSON(error.data?.message);
          window.location = `${getSubpath() ?? ''}/login/${errorObj?.organizationId}?redirectTo=${redirectPath}`;
          return;
        }
        case 501: {
          /* Restrict the users from accessing the sharable app url if the app is not released */
          if (editPermission === true && appSlug) {
            redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, { appSlug });
          } else {
            redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, {});
          }
          return;
        }
        case 404: {
          redirectToErrorPage(ERROR_TYPES.INVALID, {});
          return;
        }
        case 422: {
          redirectToErrorPage(ERROR_TYPES.UNKNOWN, {});
          return;
        }
        default: {
          redirectToErrorPage(ERROR_TYPES.UNKNOWN, {});
          return;
        }
      }
    }
  } catch (err) {
    redirectToErrorPage(ERROR_TYPES.UNKNOWN);
  }
};

const getPreviewQueryParams = (slug) => {
  const queryParams = getQueryParams();
  const envParam = (queryParams['env'] || '').toLowerCase();

  const session = authenticationService.currentSessionValue;
  const appPerms = session?.app_group_permissions;
  const hasEditPermission =
    appPerms?.is_all_editable ||
    (slug && Array.isArray(appPerms?.editable_apps_id) && appPerms.editable_apps_id.includes(slug));

  const environmentAccess = getEnvironmentAccessFromPermissions(appPerms, slug);
  // Pass requested environment directly to backend for all users
  // Backend will validate environment access and return restricted-preview error if denied
  const safeEnv = envParam;

  // Only add environment_name if there's an explicit env query param
  // Don't add default environment for apps not in editable_apps_id yet (newly created apps)
  // The backend will determine actual permissions including ownership
  return {
    ...(queryParams['version'] && { version_name: queryParams.version }),
    ...(envParam && safeEnv && { environment_name: safeEnv }),
  };
};
