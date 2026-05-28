import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { WorkspaceLockedBanner } from '@/_ui/WorkspaceLockedBanner';
import { useGitSyncConfig } from '@/AppBuilder/_hooks/useGitSyncConfig';
import { shallow } from 'zustand/shallow';

const AppCanvasBanner = ({ appId = '' }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const { fetchDevelopmentVersions, currentMode, environments } = useStore(
    (state) => ({
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      currentMode: state.modeStore.modules[moduleId].currentMode,
      environments: state.environments,
    }),
    shallow
  );
  const { isGitSyncEnabled } = useGitSyncConfig();

  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, [appId, environments]);

  const renderBanner = () => {
    if (currentMode !== 'edit') return null;
    if (isModuleEditor) {
      if (isGitSyncEnabled) {
        return <WorkspaceLockedBanner pageContext="modules" />;
      }
      return <FreezeVersionInfo info="This version is locked. To make edits, create a draft version." hide={false} />;
    }
    return <FreezeVersionInfo hide={false} />;
  };
  return <div>{renderBanner()}</div>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
