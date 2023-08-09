import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { appService, organizationService, authenticationService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import { safelyParseJSON, stripTrailingSlash, redirectToDashboard, getSubpath, getWorkspaceId } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import WorkflowEditor from '../WorkflowEditor';
import _ from 'lodash';

const AppLoaderComponent = (props) => {
  const params = useParams();
  const appId = params.id;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadAppDetails(), []);

  const [app, setApp] = useState(undefined);

  const loadAppDetails = () => {
    appService.getApp(appId, 'edit').then(setApp).catch(handleError);
  };

  const switchOrganization = (orgId) => {
    const path = `/apps/${appId}`;
    const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';
    organizationService.switchOrganization(orgId).then(
      () => {
        window.location.href = `${sub_path}/${orgId}${path}`;
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
          if (
            errorObj?.organizationId &&
            authenticationService.currentSessionValue.current_organization_id !== errorObj?.organizationId
          ) {
            switchOrganization(errorObj?.organizationId);
            return;
          }
          redirectToDashboard();
        } else if (statusCode === 401) {
          window.location = `${getSubpath() ?? ''}/login${
            !_.isEmpty(getWorkspaceId()) ? `/${getWorkspaceId()}` : ''
          }?redirectTo=${this.props.location.pathname}`;
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

  if (app?.type === 'front-end')
    return config.ENABLE_MULTIPLAYER_EDITING ? <RealtimeEditor {...props} /> : <Editor {...props} />;
  else if (app?.type === 'workflow') return <WorkflowEditor {...props} />;
};

export const AppLoader = withTranslation()(AppLoaderComponent);
