import React from 'react';
import { isEmpty } from 'lodash';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import PreviewSettings from './PreviewSettings';
import useStore from '@/AppBuilder/_stores/store';

const PreviewHeader = ({ showHeader, currentLayout, darkMode, setAppDefinitionFromVersion }) => {
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );
  const editingVersion = useStore((state) => state.editingVersion);
  const isMobileDevice = currentLayout === 'mobile';

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
      !isEmpty(editingVersion) &&
      !isReleasedVersionId && <Header className={'preview-settings-mobile'}>{_renderPreviewSettings()}</Header>
    );
  } else {
    return !isReleasedVersionId && <Header>{_renderPreviewSettings()}</Header>;
  }
};

export default PreviewHeader;
