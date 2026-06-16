import React, { useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { WorkspaceLockedBanner } from '@/_ui/WorkspaceLockedBanner';
import { shallow } from 'zustand/shallow';
import EEAppCanvasBanner from '@ee/modules/Appbuilder/components/AppCanvasBanner';

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
  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, [appId, environments]);

  const renderBanner = () => {
    if (currentMode !== 'edit') return null;
    if (isModuleEditor) {
      return <WorkspaceLockedBanner pageContext="modules" />;
    }
    return <FreezeVersionInfo hide={false} />;
  };
  return <div>{renderBanner()}</div>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppCanvasBanner : EEAppCanvasBanner;
