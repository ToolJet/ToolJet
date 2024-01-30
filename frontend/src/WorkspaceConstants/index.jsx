import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '@/_ui/Layout';
import { ManageOrgConstants } from '@/ManageOrgConstants';
import { authenticationService } from '@/_services';

export default function WorkspaceConstants({ darkMode, switchDarkMode }) {
  const navigate = useNavigate();

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateVariableOrConstant = () => {
    return canAnyGroupPerformAction(
      'org_environment_variable_create',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  useEffect(() => {
    if (!canCreateVariableOrConstant()) {
      toast.error("You don't have access to Workspace constants", { style: { maxWidth: '400px' } });
      navigate('/');
    }
  }, [canCreateVariableOrConstant]);
  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div className="workspace-constants-wrapper">
        <ManageOrgConstants darkMode={darkMode} />
      </div>
    </Layout>
  );
}
