import { useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export function useAppPreviewLink() {
  const { moduleId } = useModuleContext();
  const {
    featureAccess,
    currentPageHandle,
    selectedEnvironment,
    editingVersion,
    appId,
    slug,
    currentVersionId,
    selectedVersion,
  } = useStore(
    (state) => ({
      featureAccess: state.license?.featureAccess,
      currentPageHandle: state?.modules[moduleId].currentPageHandle,
      selectedEnvironment: state.selectedEnvironment,
      editingVersion: state.editingVersion,
      appId: state.appStore.modules[moduleId].app.appId,
      slug: state.appStore.modules[moduleId].app.slug,
      currentVersionId: state.currentVersionId,
      selectedVersion: state.selectedVersion,
    }),
    shallow
  );

  const currentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);

  const [appPreviewLink, setAppPreviewLink] = useState('');

  useEffect(() => {
    // Only exclude env if license is explicitly expired or invalid
    // If license status is undefined (not loaded yet), default to including env
    const isBasicPlan =
      featureAccess?.licenseStatus?.isExpired === true ||
      featureAccess?.licenseStatus?.isLicenseValid === false ||
      featureAccess?.multiEnvironment === false;

    // Include `branch=<name>`: the private-app-auth guard resolves the app by slug on this
    // branch (a branch-type version's slug lives on its feature branch, not the default), so the
    // preview of a branch version needs the branch context to resolve — without it the guard's
    // slug lookup misses and the app can't be found.
    const previewQuery = queryString.stringify({
      version: selectedVersion?.display_name || selectedVersion?.displayName || selectedVersion?.name,
      ...(!isBasicPlan ? { env: selectedEnvironment?.name } : {}),
      ...(currentBranch ? { branch: currentBranch.name } : {}),
    });

    const link = editingVersion
      ? `/applications/${slug || appId}/${currentPageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';

    setAppPreviewLink(link);
  }, [
    slug,
    appId,
    editingVersion,
    currentPageHandle,
    featureAccess?.multiEnvironment,
    featureAccess?.licenseStatus?.isExpired,
    featureAccess?.licenseStatus?.isLicenseValid,
    selectedEnvironment?.name,
    selectedVersion?.name,
    selectedVersion?.versionType,
    currentBranch,
  ]);

  return appPreviewLink;
}
