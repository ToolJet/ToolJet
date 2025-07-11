import React, { useEffect, useState } from 'react';
import { ReleaseVersionButton } from './ReleaseVersionButton';
import { Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import GitSyncManager from '../GitSyncManager';
import useStore from '@/AppBuilder/_stores/store';
import { PromoteReleaseButton } from '@/modules/Appbuilder/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const RightTopHeaderButtons = ({ isModuleEditor }) => {
  return (
    <div className="d-flex justify-content-end navbar-right-section">
      <div className=" release-buttons">
        <GitSyncManager />
        <PreviewAndShareIcons />
        {!isModuleEditor && <PromoteReleaseButton />}
      </div>
    </div>
  );
};

const PreviewAndShareIcons = () => {
  const { moduleId } = useModuleContext();
  const {
    featureAccess,
    currentPageHandle,
    selectedEnvironment,
    isVersionReleased,
    editingVersion,
    appId,
    app,
    slug,
    isPublic,
    currentVersionId,
    selectedVersion,
  } = useStore(
    (state) => ({
      featureAccess: state.license?.featureAccess,
      currentPageHandle: state?.modules[moduleId].currentPageHandle,
      selectedEnvironment: state.selectedEnvironment,
      isVersionReleased: state.releasedVersionId === state.selectedVersion?.id,
      editingVersion: state.editingVersion,
      appId: state.appStore.modules[moduleId].app.appId,
      app: state.appStore.modules[moduleId].app.app,
      slug: state.appStore.modules[moduleId].app.slug,
      isPublic: state.appStore.modules[moduleId].app.isPublic,
      currentVersionId: state.currentVersionId,
      selectedVersion: state.selectedVersion,
    }),
    shallow
  );

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const setCurrentMode = useStore((state) => state.setCurrentMode);
  const [appPreviewLink, setAppPreviewLink] = useState();

  useEffect(() => {
    const previewQuery = queryString.stringify({
      version: selectedVersion?.name,
      ...(featureAccess?.multiEnvironment ? { env: selectedEnvironment?.name } : {}),
    });
    setAppPreviewLink(
      editingVersion
        ? `/applications/${slug || appId}/${currentPageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
        : ''
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentVersionId, editingVersion, selectedEnvironment?.id, currentPageHandle]);

  return (
    <>
      <div class="navbar-seperator" />
      <div className="preview-share-wrap navbar-nav flex-row tw-mr-1">
        <div className="nav-item">
          {appId && (
            <ManageAppUsers
              currentEnvironment={selectedEnvironment}
              multiEnvironmentEnabled={featureAccess?.multiEnvironment}
              app={app}
              appId={appId}
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
