import React, { useEffect } from 'react';
import cx from 'classnames';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { shallow } from 'zustand/shallow';

const ReadOnlyModuleBanner = () => (
  <div className="released-version-popup-container">
    <div className={cx('released-version-popup-cover')}>
      <div
        className="d-flex popup-content"
        style={{
          width: '330px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
        }}
      >
        <p style={{ marginBottom: '0' }} data-cy="read-only-module-banner">
          Read-only — Build with only
        </p>
      </div>
    </div>
  </div>
);

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
  const isEditorReadOnly = useStore((state) => state.isEditorReadOnly);
  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, [appId, environments]);
  const renderBanner = () => {
    if (currentMode === 'edit') {
      if (isEditorReadOnly) {
        return <ReadOnlyModuleBanner />;
      }
      return <FreezeVersionInfo hide={false} />;
    }
    return null;
  };
  return <div>{renderBanner()}</div>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
