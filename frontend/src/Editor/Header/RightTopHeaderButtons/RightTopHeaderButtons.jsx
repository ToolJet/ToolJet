import React, { useEffect } from 'react';
import { ReleaseVersionButton } from './ReleaseVersionButton';
import { Link } from 'react-router-dom';
import { useAppInfo, useAppDataActions } from '@/_stores/appDataStore';
import { ManageAppUsers } from './ManageAppUsers';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import PromoteVersionButton from './PromoteVersionButton';
import { useEditorState } from '@/_stores/editorStore';

const RightTopHeaderButtons = ({ onVersionRelease, appEnvironmentChanged }) => {
  return (
    <div className="d-flex justify-content-end navbar-right-section" style={{ width: '300px', paddingRight: '12px' }}>
      <div className=" release-buttons navbar-nav flex-row">
        <PreviewAndShareIcons />
        <PromoteAndReleaseButton onVersionRelease={onVersionRelease} appEnvironmentChanged={appEnvironmentChanged} />
      </div>
    </div>
  );
};

const PreviewAndShareIcons = () => {
  const { appId, app, slug, isPublic, appVersionPreviewLink, currentVersionId } = useAppInfo();
  const { featureAccess } = useEditorState();
  const { setAppPreviewLink } = useAppDataActions();
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
    }),
    shallow
  );
  const { pageHandle } = useCurrentStateStore(
    (state) => ({
      pageHandle: state?.page?.handle,
    }),
    shallow
  );
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { selectedEnvironment } = useEnvironmentsAndVersionsStore(
    (state) => ({
      selectedEnvironment: state.selectedEnvironment,
    }),
    shallow
  );

  useEffect(() => {
    const previewQuery = queryString.stringify({
      version: editingVersion?.name,
      ...(featureAccess?.multiEnvironment ? { env: selectedEnvironment?.name } : {}),
    });
    const appVersionPreviewLink = editingVersion.id
      ? `/applications/${slug || appId}/${pageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';
    setAppPreviewLink(appVersionPreviewLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentVersionId, editingVersion, selectedEnvironment?.id, pageHandle]);

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
            pageHandle={pageHandle}
            darkMode={darkMode}
            isVersionReleased={isVersionReleased}
            isPublic={isPublic ?? false}
          />
        )}
      </div>
      <div className="nav-item">
        <Link
          title="Preview"
          to={appVersionPreviewLink}
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

const PromoteAndReleaseButton = ({ onVersionRelease, appEnvironmentChanged }) => {
  const { shouldRenderPromoteButton, shouldRenderReleaseButton } = useEnvironmentsAndVersionsStore(
    (state) => ({
      shouldRenderPromoteButton: state.shouldRenderPromoteButton,
      shouldRenderReleaseButton: state.shouldRenderReleaseButton,
    }),
    shallow
  );

  return (
    <div className="nav-item dropdown promote-release-btn">
      {shouldRenderPromoteButton && <PromoteVersionButton appEnvironmentChanged={appEnvironmentChanged} />}
      {shouldRenderReleaseButton && <ReleaseVersionButton onVersionRelease={onVersionRelease} />}
    </div>
  );
};

export default RightTopHeaderButtons;
