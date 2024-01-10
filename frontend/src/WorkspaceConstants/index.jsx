import React from 'react';
import Layout from '@/_ui/Layout';
import { ManageOrgConstants } from '@/ManageOrgConstants';

export default function WorkspaceConstants({ darkMode, switchDarkMode }) {
  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div className="workspace-constants-wrapper">
        <ManageOrgConstants darkMode={darkMode} />
      </div>
    </Layout>
  );
}
