import React from 'react';
import { ManageAppUsers } from './ManageAppUsers';
import { shallow } from 'zustand/shallow';
import GitSyncManager from '../GitSyncManager';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const RightTopHeaderButtons = ({ currentMode, darkMode }) => {
  return (
    <div className="d-flex justify-content-end navbar-right-section tw-ml-[4px]">
      <div className=" release-buttons">
        {currentMode !== 'view' && (
          <>
            <GitSyncManager />
            <div className="tw-hidden navbar-seperator" />
          </>
        )}
        <PreviewAndShareIcons darkMode={darkMode} />
      </div>
    </div>
  );
};

const PreviewAndShareIcons = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const {
    featureAccess,
    currentPageHandle,
    selectedEnvironment,
    isVersionReleased,
    appId,
    app,
    slug,
    isPublic,
    appName,
    selectedVersion,
    editingVersion,
  } = useStore(
    (state) => ({
      featureAccess: state.license?.featureAccess,
      currentPageHandle: state?.modules[moduleId].currentPageHandle,
      selectedEnvironment: state.selectedEnvironment,
      isVersionReleased: state.releasedVersionId === state.selectedVersion?.id,
      appId: state.appStore.modules[moduleId].app.appId,
      app: state.appStore.modules[moduleId].app.app,
      slug: state.appStore.modules[moduleId].app.slug,
      isPublic: state.appStore.modules[moduleId].app.isPublic,
      appName: state.appStore.modules[moduleId].app.appName,
      selectedVersion: state.selectedVersion,
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  return (
    <>
      <div className="preview-share-wrap navbar-nav flex-row tw-mr-1">
        <div className="nav-item">
          {appId && (
            <ManageAppUsers
              currentEnvironment={selectedEnvironment}
              currentVersion={selectedVersion}
              editingVersion={editingVersion}
              multiEnvironmentEnabled={featureAccess?.multiEnvironment}
              app={app}
              appId={appId}
              appName={appName}
              slug={slug}
              pageHandle={currentPageHandle}
              darkMode={darkMode}
              isVersionReleased={isVersionReleased}
              isPublic={isPublic ?? false}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default RightTopHeaderButtons;
