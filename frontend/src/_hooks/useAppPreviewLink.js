import { useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

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

  const [appPreviewLink, setAppPreviewLink] = useState('');

  useEffect(() => {
    // Only exclude env if license is explicitly expired or invalid
    // If license status is undefined (not loaded yet), default to including env
    const isBasicPlan =
      featureAccess?.licenseStatus?.isExpired === true ||
      featureAccess?.licenseStatus?.isLicenseValid === false ||
      featureAccess?.plan === 'starter';

    const previewQuery = queryString.stringify({
      version: selectedVersion?.name,
      // Include env param unless license is invalid/expired or starter plan
      ...(!isBasicPlan ? { env: selectedEnvironment?.name } : {}),
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
  ]);

  return appPreviewLink;
}
