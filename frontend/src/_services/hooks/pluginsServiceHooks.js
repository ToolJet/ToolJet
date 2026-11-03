import { useMutation } from '@tanstack/react-query';

import { pluginsService } from '@/_services/plugins.service';

export function useFindDependentPlugins() {
  return useMutation({
    mutationFn: (dataSources) => pluginsService.findDependentPlugins(dataSources),
  });
}

export function useInstallDependentPlugins() {
  return useMutation({
    mutationFn: ({ dependentPlugins, shouldAutoImportPlugin }) =>
      pluginsService.installDependentPlugins(dependentPlugins, shouldAutoImportPlugin),
  });
}

export function useUninstallPlugins() {
  return useMutation({
    mutationFn: (pluginsId) => pluginsService.uninstallPlugins(pluginsId),
  });
}
