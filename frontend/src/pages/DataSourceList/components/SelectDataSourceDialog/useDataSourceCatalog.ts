import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shallow } from 'zustand/shallow';

import { checkIfToolJetCloud } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import { pluginsService } from '@/_services/plugins.service';
import { useAppDataStore } from '@/_stores/appDataStore';
import { fetchEdition } from '@/modules/common/helpers/utils';

import { buildCatalogSections, type CatalogSource } from './catalog';

export function useDataSourceCatalog(enabled: boolean) {
  const session = authenticationService.currentSessionValue;
  const { tooljetVersion } = useAppDataStore(
    (state: { metadata?: { installed_version?: string } }) => ({ tooljetVersion: state?.metadata?.installed_version }),
    shallow
  );

  const edition = String(fetchEdition() || '').toLowerCase();
  const isCloudEdition = edition === 'cloud' || checkIfToolJetCloud(tooljetVersion);
  const canUseMarketplace =
    !isCloudEdition && Boolean(session?.admin || session?.super_admin || session?.user_permissions?.is_builder);

  const { data: installedPlugins, isPending } = useQuery<CatalogSource[]>({
    queryKey: ['global-data-source-plugins'],
    queryFn: async () => {
      const { data = [] } = await pluginsService.findAll();
      return data;
    },
    enabled,
  });

  const sections = useMemo(
    () => buildCatalogSections(installedPlugins ?? [], { includePlugins: !isCloudEdition }),
    [installedPlugins, isCloudEdition]
  );

  return { sections, isLoading: enabled && isPending, canUseMarketplace };
}
