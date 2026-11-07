import React from 'react';
import { isEmpty } from 'lodash';
import Header from './Header';
import PreviewSettings from './PreviewSettings';
import useStore from '@/AppBuilder/_stores/store';
import { useIsAppPreview } from '@/AppBuilder/_hooks/useIsAppPreview';

const PreviewHeader = ({ showHeader, currentLayout, darkMode, setAppDefinitionFromVersion }) => {
  const isAppPreview = useIsAppPreview();

  const editingVersion = useStore((state) => state.editingVersion);
  const isMobileDevice = currentLayout === 'mobile';

  // Don't render header at all if not in preview mode or if accessing as public (not logged in)
  if (!isAppPreview) {
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
