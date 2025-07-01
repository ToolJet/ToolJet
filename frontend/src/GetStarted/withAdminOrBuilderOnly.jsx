import React from 'react';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { authenticationService } from '@/_services';
import { checkIfToolJetCloud } from '@/_helpers/utils';

export default function withAdminOrBuilderOnly(Component) {
  return function WrappedComponent(props) {
    const edition = fetchEdition();
    const isToolJetCloud = checkIfToolJetCloud(props.version || '');
    const { admin, is_builder } = authenticationService.currentSessionValue || {};
    if (!admin && !is_builder) return null;
    if (edition === 'ce' && !isToolJetCloud) return null;
    return <Component {...props} edition={edition} isToolJetCloud={isToolJetCloud} />;
  };
}
