import { organizationService, authenticationService, appsService } from '@/_services';
import { safelyParseJSON, getWorkspaceId } from '@/_helpers/utils';
import { redirectToDashboard, getSubpath, getQueryParams, redirectToErrorPage } from '@/_helpers/routes';
import { toast } from 'react-hot-toast';
import _ from 'lodash';
import queryString from 'query-string';
import { ERROR_TYPES } from './constants';

export const handleAppAccess = (componentType, slug) => {
  const previewQueryParams = getPreviewQueryParams();
  const isLocalPreview = !_.isEmpty(previewQueryParams);
  const queryParams = { ...previewQueryParams, access_type: isLocalPreview ? 'view' : 'edit' };
  const query = queryString.stringify(previewQueryParams);
  const redirectPath = !_.isEmpty(query) ? `/applications/${slug}${query ? `?${query}` : ''}` : `/apps/${slug}`;

  if (componentType === 'editor' || isLocalPreview) {
    /* Editor or app preview */
    return appsService.validatePrivateApp(slug, queryParams).catch((error) => {
      handleError(componentType, error, slug, redirectPath);
    });
  } else {
    /* Released app link [launch/sharable link] */
    return appsService.validateReleasedApp(slug).catch((error) => {
      handleError(componentType, error, redirectPath);
    });
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

const handleError = (componentType, error, redirectPath) => {
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
          break;
        }
        case 401: {
          window.location = `${getSubpath() ?? ''}/login/${getWorkspaceId()}?redirectTo=${redirectPath}`;
          return;
        }
        case 501: {
          /* Restrict the users from accessing the sharable app url if the app is not released */
          redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, {});
          return;
        }
        default: {
          if (statusCode === 404 || statusCode === 422) {
            toast.error(error?.error ?? 'App not found');
            return;
          }
          break;
        }
      }
      redirectToDashboard();
    }
  } catch (err) {
    redirectToDashboard();
  }
};

const getPreviewQueryParams = () => {
  const queryParams = getQueryParams();
  return {
    ...(queryParams['version'] && { version_name: queryParams.version }),
  };
};
