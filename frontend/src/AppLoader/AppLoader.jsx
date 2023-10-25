import React, { useEffect, useState } from 'react';
import { withTranslation, useTranslation } from 'react-i18next';
import { appService, organizationService, authenticationService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import { safelyParseJSON, stripTrailingSlash, getSubpath, getWorkspaceId } from '@/_helpers/utils';
import { useParams } from 'react-router-dom';
import WorkflowEditor from '../WorkflowEditor';
import _ from 'lodash';
import RestrictedAccessModal from './RestrictedAccessModal';
import ErrorModal from './ErrorModal';

const AppLoaderComponent = (props) => {
  const params = useParams();
  const appId = params.id;
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';

  // State variable to control the modal
  const [showRestrictedAccessModal, setShowRestrictedAccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
          setShowRestrictedAccessModal(true);
        } else if (statusCode === 401) {
          window.location = `${getSubpath() ?? ''}/login${
            !_.isEmpty(getWorkspaceId()) ? `/${getWorkspaceId()}` : ''
          }?redirectTo=${this.props.location.pathname}`;
          return;
        } else {
          setShowErrorModal(true);
        }
      }
    } catch (err) {
      setShowErrorModal(true);
    }
  };

  if (app?.type === 'front-end') return shouldEnableMultiplayer ? <RealtimeEditor {...props} /> : <Editor {...props} />;
  else if (app?.type === 'workflow') return <WorkflowEditor {...props} />;

  return (
    <>
      {showRestrictedAccessModal && (
        <RestrictedAccessModal
          show={true}
          darkMode={props.darkMode}
          onClose={() => setShowRestrictedAccessModal(false)}
        />
      )}

      {showErrorModal && <ErrorModal show={true} darkMode={props.darkMode} onClose={() => setShowErrorModal(false)} />}
    </>
  );
};

export const AppLoader = withTranslation()(AppLoaderComponent);
