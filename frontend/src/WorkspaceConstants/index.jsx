import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { authenticationService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { fetchEdition } from '@/modules/common/helpers/utils';

import Layout from '@/_ui/Layout';
import ManageOrgConstantsSettings from '@/modules/WorkspaceSettings/components/ManageOrgConstantsSettings/ManageOrgConstantsSettings';

export default function WorkspaceConstants({ darkMode, switchDarkMode }) {
  const navigate = useNavigate();
  const { super_admin } = authenticationService?.currentSessionValue ?? {};

  const canCreateVariableOrConstant = () => {
    return authenticationService.currentSessionValue.user_permissions.org_constant_c_r_u_d || super_admin;
  };

  useEffect(() => {
    if (!canCreateVariableOrConstant()) {
      const edition = fetchEdition();
      toast.error("You don't have access to Workspace constants", { style: { maxWidth: '400px' } });
      navigate(`/${getWorkspaceId()}${edition === 'ce' ? '/' : '/home'}`);
    }
  }, [canCreateVariableOrConstant]);
  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div>
        <ManageOrgConstantsSettings darkMode={darkMode} />
      </div>
    </Layout>
  );
}
