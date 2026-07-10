import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { WorkspaceLockedBanner } from '@/_ui/WorkspaceLockedBanner';
import LockedBranchBanner from '@/AppBuilder/Header/LockedBranchBanner';
import { useGitSyncConfig } from '@/AppBuilder/_hooks/useGitSyncConfig';
import { shallow } from 'zustand/shallow';

const AppCanvasBanner = ({ appId = '' }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const {
    fetchDevelopmentVersions,
    currentMode,
    environments,
    developmentVersions,
    selectedVersion,
    setGitSyncLicenseLocked,
  } = useStore(
    (state) => ({
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      currentMode: state.modeStore.modules[moduleId].currentMode,
      environments: state.environments,
      developmentVersions: state.developmentVersions,
      selectedVersion: state.selectedVersion,
      setGitSyncLicenseLocked: state.setGitSyncLicenseLocked,
    }),
    shallow
  );
  const { isGitSyncEnabled, isGitSyncLicenseLocked } = useGitSyncConfig();

  const isCurrentVersionLocked = !!(
    selectedVersion &&
    (selectedVersion.status === 'PUBLISHED' ||
      developmentVersions?.find((v) => v.id === selectedVersion.id && v.status === 'PUBLISHED'))
  );

  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, [appId, environments]);

  // Keep the editor-wide freeze flag in sync with the git-sync license state.
  useEffect(() => {
    setGitSyncLicenseLocked?.(!!isGitSyncLicenseLocked);
  }, [isGitSyncLicenseLocked, setGitSyncLicenseLocked]);

  const renderBanner = () => {
    if (currentMode !== 'edit') return null;
    // Git configured but unlicensed freezes everything — take precedence over other banners.
    if (isGitSyncLicenseLocked) {
      return <LockedBranchBanner isVisible reason="git_sync_license_off" />;
    }
    if (isModuleEditor) {
      if (isGitSyncEnabled) {
        return <WorkspaceLockedBanner pageContext="modules" />;
      }
      if (isCurrentVersionLocked) {
        return <FreezeVersionInfo info="This version is locked. To make edits, create a draft version." hide={false} />;
      }
      return null;
    }
    return <FreezeVersionInfo hide={false} />;
  };
  return <div>{renderBanner()}</div>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
