// src/modules/OrganizationSettings/OrganizationLogin/AutoSSOLogin.jsx

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEAutoSSOLogin from '@ee/modules/WorkspaceSettings/components/AutoSSOLogin';

const AutoSSOLogin = pickEditionSpecificComponent({
  ee: EEAutoSSOLogin,
  cloudSameAsEE: true,
});

export default AutoSSOLogin;
