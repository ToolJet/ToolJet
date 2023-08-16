import { organizationService, authenticationService, appsService } from '@/_services';
import { safelyParseJSON, getWorkspaceId } from '@/_helpers/utils';
import { redirectToDashboard, getSubpath, getPathname, getQueryParams } from '@/_helpers/routes';
import { toast } from 'react-hot-toast';
import _ from 'lodash';
import queryString from 'query-string';

export const handleAppAccess = (componentType, slug) => {
  const previewQueryParams = getPreviewQueryParams();
  const isLocalPreview = !_.isEmpty(previewQueryParams);
  const queryParams = { ...previewQueryParams, access_type: isLocalPreview ? 'view' : 'edit' };
  if (componentType === 'editor' || isLocalPreview) {
    /* Editor or app preview */
    return appsService.validatePrivateApp(slug, queryParams).catch((error) => {
      handleError(componentType, error, slug, previewQueryParams);
    });
  } else {
    /* Released app link [launch/sharable link] */
    return appsService.validateReleasedApp(slug).catch((error) => {
      handleError(componentType, error, slug);
    });
  }
};

const switchOrganization = (componentType, slug, orgId, previewQueryParams) => {
  const query = queryString.stringify(previewQueryParams);
  const path = !_.isEmpty(query) ? `/applications/${slug}${query ? `?${query}` : ''}` : `/apps/${slug}`;
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

const handleError = (componentType, error, slug, previewQueryParams) => {
  try {
    if (error?.data) {
      const statusCode = error.data?.statusCode;
      if (statusCode === 403) {
        const errorObj = safelyParseJSON(error.data?.message);
        const currentSessionValue = authenticationService.currentSessionValue;
        if (
          errorObj?.organizationId &&
          currentSessionValue.current_user &&
          currentSessionValue.current_organization_id !== errorObj?.organizationId
        ) {
          switchOrganization(componentType, slug, errorObj?.organizationId, previewQueryParams);
          return;
        }
        redirectToDashboard();
      } else if (statusCode === 401) {
        window.location = `${getSubpath() ?? ''}/login/${getWorkspaceId()}?redirectTo=${getPathname(null, true)}`;
        return;
      } else if (statusCode === 404 || statusCode === 422) {
        toast.error(error?.error ?? 'App not found');
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
