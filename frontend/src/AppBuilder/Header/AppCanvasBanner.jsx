import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { shallow } from 'zustand/shallow';

const AppCanvasBanner = ({ appId = '' }) => {
  const { moduleId } = useModuleContext();
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const renderBanner = () => {
    if (currentMode === 'edit') {
      return <FreezeVersionInfo hide={false} />;
    }
    return null;
  };
  return <div>{renderBanner()}</div>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
