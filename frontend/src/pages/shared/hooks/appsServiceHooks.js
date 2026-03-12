import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getWorkspaceId } from '@/_helpers/utils';
import { appsService } from '@/_services/apps.service';
import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import { useAppFilters } from './useAppFilters';
import { useWorkflowListStore } from '../../Workflows/store';
import { appTypeToDisplayNameMapping } from '../helper';

const handleError = (error) => {
  if ([409, 451].includes(error.statusCode)) return;

  const errorMessage = error?.error || error?.message || 'Some Error Occured';
  toast.error(errorMessage, { position: 'top-center', style: { fontSize: '12px' } });
};

const selectApps = (raw) => ({
  apps: raw?.apps ?? [],
  meta: raw?.meta ?? {},
});

export function useFetchApps(queryParams, options) {
  const { pageNo = 1, folderId = '', appSearchQuery = '', appType = 'front-end' } = queryParams;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['apps', { pageNo, folderId, appSearchQuery, appType }],
    queryFn: () => appsService.getAll(pageNo, folderId, appSearchQuery, appType),
    select: selectApps,
    enabled,
  });
}

export function useFetchAppsLimit() {
  return useQuery({
    queryKey: ['appsLimit'],
    queryFn: appsService.getAppsLimit,
  });
}

const workflowLimitSelect = (raw) => raw?.appsCount;

export function useFetchWorkflowLimit(type) {
  return useQuery({
    queryKey: ['workflowLimit', type],
    queryFn: () => appsService.getWorkflowLimit(type),
    select: workflowLimitSelect,
  });
}

export function useCloneApp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ body, appType }) => appsService.cloneResource(body, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} cloned successfully!`);

      navigate(`/${getWorkspaceId()}/apps/${response?.imports?.app[0]?.id}`, {
        // TODO: Pass actual commit Enabled value later on, for timebeing have passed as false
        state: { commitEnabled: false },
      });
    },
  });
}

export function useRenameApp() {
  const { folderId } = useAppFilters();
  const queryClient = useQueryClient();
  const currentPage = useWorkflowListStore((state) => state.currentPage);
  const appSearchQuery = useWorkflowListStore((state) => state.appSearchQuery);

  return useMutation({
    mutationFn: ({ appId, name, appType }) => appsService.saveApp(appId, { name }, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} name has been updated!`);

      queryClient.invalidateQueries({
        queryKey: ['apps', { pageNo: currentPage, folderId, appSearchQuery, appType: variables.appType }],
      });
    },
  });
}

export function useCreateApp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body) => appsService.createApp(body),
    onError: (error) => {
      // TODO: Required for apps page
      // this.eraseAIOnboardingRelatedCookies();
      // _self.setState({ showAIOnboardingLoadingScreen: false });
      handleError(error);
    },
    onSuccess: (response, variables) => {
      console.log('create app', response, variables);

      posthogHelper.captureEvent('click_new_app', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: response?.id,
        button_name: 'click_new_app_button',
      });

      variables?.type === 'front-end' &&
        posthogHelper.captureEvent('app_created', {
          entry_source: variables?.prompt ? 'prompt' : 'create_button',
          prompt: variables?.prompt,
        });

      navigate(`/${getWorkspaceId()}/apps/${response.id}`, {
        // TODO: Pass actual commit Enabled value later on, for timebeing have passed as false
        state: { commitEnabled: false, prompt: variables?.prompt },
      });

      // TODO: Required for apps page
      // this.eraseAIOnboardingRelatedCookies();
      // _self.setState({ showAIOnboardingLoadingScreen: false });

      variables?.type !== 'front-end' &&
        toast.success(`${appTypeToDisplayNameMapping[variables.type]} created successfully!`);
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, appType }) => appsService.deleteApp(id, appType),
    onError: () => {
      toast.error('Could not delete the app.');
    },
    onSuccess: (response, variables) => {
      console.log('delete app variables', variables);

      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} deleted successfully.`);

      queryClient.invalidateQueries({ queryKey: ['folders'] });

      // TODO: re-fetch apps list
      // this.fetchApps(
      //   this.state.currentPage
      //     ? this.state.apps?.length === 1
      //       ? this.state.currentPage - 1
      //       : this.state.currentPage
      //     : 1,
      //   this.state.currentFolder.id
      // );

      if (variables.appType === 'workflow') {
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'instance'] });
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'workspace'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['appsLimit'] });
      }
    },
  });
}

export function useChangeAppIcon() {
  return useMutation({
    mutationFn: ({ icon, appId }) => appsService.changeIcon(icon, appId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Icon updated.');

      // TODO: Need to know which page data to update??
      // queryClient.setQueryData()

      // const updatedApps = apps.map((app) => {
      //   if (app.id === appOperations.selectedApp.id) {
      //     app.icon = appOperations.selectedIcon;
      //   }
      //   return app;
      // });
    },
  });
}
