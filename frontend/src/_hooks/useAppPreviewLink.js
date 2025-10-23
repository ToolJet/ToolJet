import { useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import queryString from 'query-string';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export function useAppPreviewLink() {
  const { moduleId } = useModuleContext();
  const { currentPageHandle, selectedEnvironment, editingVersion, appId, slug, selectedVersion } = useStore(
    (state) => ({
      currentPageHandle: state?.modules[moduleId].currentPageHandle,
      selectedEnvironment: state.selectedEnvironment,
      editingVersion: state.editingVersion,
      appId: state.appStore.modules[moduleId].app.appId,
      slug: state.appStore.modules[moduleId].app.slug,
      selectedVersion: state.selectedVersion,
    }),
    shallow
  );

  const featureAccess = useLicenseStore((state) => state?.featureAccess);

  const [appPreviewLink, setAppPreviewLink] = useState('');

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
  }, [
    slug,
    appId,
    editingVersion,
    currentPageHandle,
    featureAccess?.multiEnvironment,
    selectedEnvironment?.name,
    selectedVersion?.name,
  ]);

  return appPreviewLink;
}
