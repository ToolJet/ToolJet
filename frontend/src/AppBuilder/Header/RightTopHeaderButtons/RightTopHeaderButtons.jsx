import React, { useEffect, useState } from 'react';
import { ReleaseVersionButton } from './ReleaseVersionButton';
import { Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import PromoteVersionButton from './PromoteVersionButton';
import useStore from '@/AppBuilder/_stores/store';

const RightTopHeaderButtons = () => {
  return (
    <div className="d-flex justify-content-end navbar-right-section" style={{ width: '300px', paddingRight: '12px' }}>
      <div className=" release-buttons navbar-nav flex-row">
        <PreviewAndShareIcons />
        <PromoteAndReleaseButton />
      </div>
    </div>
  );
};

const PreviewAndShareIcons = () => {
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
      currentPageHandle: state?.currentPageHandle,
      selectedEnvironment: state.selectedEnvironment,
      isVersionReleased: state.releasedVersionId === state.selectedVersion?.id,
      editingVersion: state.editingVersion,
      appId: state.app.appId,
      app: state.app.app,
      slug: state.app.slug,
      isPublic: state.app.isPublic,
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
    <div className="preview-share-wrap navbar-nav flex-row" style={{ gap: '4px' }}>
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
      <div className="nav-item">
        <Link
          title="Preview"
          to={appPreviewLink}
          target="_blank"
          rel="noreferrer"
          data-cy="preview-link-button"
          className="editor-header-icon tj-secondary-btn"
        >
          <SolidIcon name="eyeopen" width="14" fill="#3E63DD" />
        </Link>
      </div>
    </div>
  );
};

const PromoteAndReleaseButton = () => {
  const getCanPromoteAndRelease = useStore((state) => state.getCanPromoteAndRelease);
  const { canPromote, canRelease } = getCanPromoteAndRelease();
  return (
    <div className="nav-item dropdown promote-release-btn">
      {canPromote && <PromoteVersionButton />}
      {canRelease && <ReleaseVersionButton />}
    </div>
  );
};

export default RightTopHeaderButtons;
