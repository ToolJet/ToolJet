import React, { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { appService, organizationService, authenticationService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import { safelyParseJSON, stripTrailingSlash } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import useRouter from '@/_hooks/use-router';

const AppLoaderComponent = (props) => {
  const router = useRouter();
  const appId = props.match.params.id;
  const currentUser = authenticationService.currentUserValue;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadAppDetails(), []);

  const loadAppDetails = () => {
    appService.getApp(appId, 'edit').catch((error) => {
      handleError(error);
    });
  };

  const switchOrganization = (orgId) => {
    const path = `/apps/${appId}`;
    const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';
    organizationService.switchOrganization(orgId).then(
      (data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = `${sub_path}${path}`;
      },
      () => {
        return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
      }
    );
  };

  const handleError = (error) => {
    try {
      if (error?.data) {
        const statusCode = error.data?.statusCode;
        if (statusCode === 403) {
          const errorObj = safelyParseJSON(error.data?.message);
          if (errorObj?.organizationId && currentUser.organization_id !== errorObj?.organizationId) {
            switchOrganization(errorObj?.organizationId);
            return;
          }
          return router.push('/');
        } else if (statusCode === 404 || statusCode === 422) {
          toast.error(error?.error ?? 'App not found');
        }
        return router.push('/');
      }
    } catch (err) {
      return router.push('/');
    }
  };

  return config.ENABLE_MULTIPLAYER_EDITING ? <RealtimeEditor {...props} /> : <Editor {...props} />;
};

export const AppLoader = withTranslation()(AppLoaderComponent);
