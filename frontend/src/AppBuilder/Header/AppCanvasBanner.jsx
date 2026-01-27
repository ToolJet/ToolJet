import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { shallow } from 'zustand/shallow';

const AppCanvasBanner = ({ appId = '' }) => {
  const { moduleId } = useModuleContext();
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
    if (currentMode === 'edit') {
      return <FreezeVersionInfo hide={false} />;
    }
    return null;
  };
  return <div>{renderBanner()}</div>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
