import { organizationService, authenticationService, appsService } from '@/_services';
import { safelyParseJSON, stripTrailingSlash, redirectToDashboard, getSubpath, getWorkspaceId } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';

export const handleAppAccess = (componentType, slug, versionId) => {
  if (componentType === 'editor' || versionId) {
    /* Editor or app preview */
    return appsService.validatePrivateApp(slug, versionId ? 'view' : 'edit').catch((error) => {
      handleError(componentType, error, slug, versionId);
    });
  } else {
    /* Released app link [launch/sharable link] */
    return appsService.validateReleasedApp(slug).catch((error) => {
      handleError(componentType, error, slug, versionId);
    });
  }
};

const switchOrganization = (componentType, slug, orgId, versionId) => {
  const path = versionId ? `/applications/${slug}${versionId ? `/versions/${versionId}` : ''}` : `/apps/${slug}`;

  const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';
  organizationService.switchOrganization(orgId).then(
    () => {
      window.location.href = componentType === 'editor' ? `${sub_path}/${orgId}${path}` : `${sub_path}${path}`;
    },
    () => {
      return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
    }
  );
};

const handleError = (componentType, error, slug, versionId) => {
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
          switchOrganization(componentType, slug, errorObj?.organizationId, versionId);
          return;
        }
        redirectToDashboard();
      } else if (statusCode === 401) {
        window.location = `${getSubpath() ?? ''}/login/${getWorkspaceId()}?redirectTo=${window.location.pathname}`;
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
