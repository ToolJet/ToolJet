import React from 'react';
import { isEmpty } from 'lodash';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import PreviewSettings from './PreviewSettings';
import useStore from '@/AppBuilder/_stores/store';

const PreviewHeader = ({ showHeader, currentLayout, darkMode, setAppDefinitionFromVersion }) => {
  const location = useLocation();
  // Check if we're in preview mode (has env or version query params)
  const searchParams = new URLSearchParams(location.search);
  const isPreviewMode = searchParams.has('env') || searchParams.has('version');

  const editingVersion = useStore((state) => state.editingVersion);
  const isPublicAccess = useStore((state) => state.isPublicAccess);
  const isMobileDevice = currentLayout === 'mobile';

  // Don't render header at all if not in preview mode or if accessing as public (not logged in)
  if (!isPreviewMode || isPublicAccess) {
    return null;
  }

  const _renderPreviewSettings = () => (
    <PreviewSettings
      isMobileLayout={isMobileDevice}
      showHeader={showHeader}
      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
      darkMode={darkMode}
    />
  );

  if (isMobileDevice) {
    return (
      !isEmpty(editingVersion) && <Header className={'preview-settings-mobile'}>{_renderPreviewSettings()}</Header>
    );
  } else {
    return <Header>{_renderPreviewSettings()}</Header>;
  }
};

export default PreviewHeader;
