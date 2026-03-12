import { useMutation } from '@tanstack/react-query';

import { pluginsService } from '@/_services/plugins.service';

export function useFindDependentPlugins() {
  return useMutation({
    mutationFn: (dataSources) => pluginsService.findDependentPlugins(dataSources),
  });
}
