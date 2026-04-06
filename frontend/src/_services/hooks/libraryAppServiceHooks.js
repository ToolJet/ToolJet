import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useMutation, useQuery } from '@tanstack/react-query';

import { getWorkspaceId } from '@/_helpers/utils';
import { libraryAppService } from '@/_services/library-app.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

export function useDeployTemplateApp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ identifier, appName, dependentPlugins = [], shouldAutoImportPlugin = false }) =>
      libraryAppService.deploy(identifier, appName, dependentPlugins, shouldAutoImportPlugin),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success(`${variables.appTypeDisplayName} created successfully!`, { position: 'top-center' });

      posthogHelper.captureEvent('app_created', { entry_source: 'template' });

      navigate(`/${getWorkspaceId()}/apps/${response.app[0].id}`, {
        state: { commitEnabled: variables.isCommitEnabled ?? false },
      });
    },
  });
}

export function useFetchTemplateDependentPlugins(templateId) {
  return useQuery({
    queryKey: ['templateDependentPlugins', templateId],
    queryFn: () => libraryAppService.findDependentPluginsInTemplate(templateId),
    enabled: !!templateId,
  });
}
