import { useMutation, useQuery } from '@tanstack/react-query';

import { libraryAppService } from '../library-app.service';

export function useDeployTemplateApp() {
  return useMutation({
    mutationFn: ({ identifier, appName, dependentPlugins = [], shouldAutoImportPlugin = false }) =>
      libraryAppService.deploy(identifier, appName, dependentPlugins, shouldAutoImportPlugin),
  });
}

export function useFetchTemplateDependentPlugins(templateId) {
  return useQuery({
    queryKey: ['templateDependentPlugins', templateId],
    queryFn: () => libraryAppService.findDependentPluginsInTemplate(templateId),
    enabled: !!templateId,
  });
}
