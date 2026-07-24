import React from 'react';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { authenticationService } from '@/_services';
import { checkIfToolJetCloud } from '@/_helpers/utils';
import { useNavigate } from 'react-router-dom';
import { getPrivateRoute } from '@/_helpers/routes';
export default function withAdminOrBuilderOnly(Component) {
  return function WrappedComponent(props) {
    const edition = fetchEdition();
    const navigate = useNavigate();
    const isToolJetCloud = checkIfToolJetCloud(props.version || '');
    const aiCookies = authenticationService.currentSessionValue?.ai_cookies;
    const isEndUser = authenticationService?.currentSessionValue?.role?.name == 'end-user';

    if (isEndUser) navigate(getPrivateRoute('dashboard'), { replace: true });

    if (edition === 'ce' || (edition === 'cloud' && (aiCookies?.tj_ai_prompt || aiCookies?.tj_template_id)))
      navigate(getPrivateRoute('dashboard'), { replace: true }); // if user is trying to create app from website via prompt or template then redirect to dashboard page where logic is already handled for this scenario

    return <Component {...props} edition={edition} isToolJetCloud={isToolJetCloud} />;
  };
}
