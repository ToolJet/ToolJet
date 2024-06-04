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

const RightTopHeaderButtons = ({ onVersionRelease }) => {
  return (
    <div className="d-flex justify-content-end navbar-right-section" style={{ width: '300px', paddingRight: '12px' }}>
      <div className=" release-buttons navbar-nav flex-row">
        <PreviewAndShareIcons />
        <PromoteAndReleaseButton onVersionRelease={onVersionRelease} />
      </div>
    </div>
  );
};

const PreviewAndShareIcons = () => {
  const { appId, app, slug, isPublic, appVersionPreviewLink, currentVersionId } = useAppInfo();
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

  useEffect(() => {
    const previewQuery = queryString.stringify({ version: editingVersion.name });
    const appVersionPreviewLink = editingVersion.id
      ? `/applications/${slug || appId}/${pageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';
    setAppPreviewLink(appVersionPreviewLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentVersionId, editingVersion]);

  return (
    <div className="preview-share-wrap navbar-nav flex-row" style={{ gap: '4px' }}>
      <div className="nav-item">
        {appId && (
          <ManageAppUsers
            app={app}
            appId={appId}
            slug={slug}
            darkMode={darkMode}
            isVersionReleased={isVersionReleased}
            pageHandle={pageHandle}
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

const PromoteAndReleaseButton = ({ onVersionRelease }) => {
  const { shouldRenderPromoteButton, shouldRenderReleaseButton } = useEnvironmentsAndVersionsStore(
    (state) => ({
      shouldRenderPromoteButton: state.shouldRenderPromoteButton,
      shouldRenderReleaseButton: state.shouldRenderReleaseButton,
    }),
    shallow
  );

  return (
    <div className="nav-item dropdown promote-release-btn">
      {shouldRenderPromoteButton && <PromoteVersionButton />}
      {shouldRenderReleaseButton && <ReleaseVersionButton onVersionRelease={onVersionRelease} />}
    </div>
  );
};

export default RightTopHeaderButtons;
