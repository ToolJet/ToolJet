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
    const isEndUser = authenticationService?.currentSessionValue?.role?.name == 'end-user';
    if (isEndUser) navigate(getPrivateRoute('dashboard'));
    if (edition === 'ce' && !isToolJetCloud) navigate(getPrivateRoute('dashboard'));
    return <Component {...props} edition={edition} isToolJetCloud={isToolJetCloud} />;
  };
}
