import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { authenticationService } from '@/_services/authentication.service.js';

import { useDeployTemplateApp } from '../../../_services/hooks/libraryAppServiceHooks';
import { useDeleteAiCookies } from '../../../_services/hooks/aiOnboardingServiceHooks';
import { useCreateApp } from '../../shared/hooks/appsServiceHooks';

export default function useHandleAppCreationFromLandingPage() {
  const { mutate: deleteAiCookies } = useDeleteAiCookies();
  const { mutate: deployTemplateApp } = useDeployTemplateApp();
  const { mutate: createApp } = useCreateApp();

  const [showAIOnboardingLoadingScreen, setShowAIOnboardingLoadingScreen] = useState(false);
  const [showInsufficentPermissionModalstate, setShowInsufficentPermissionModal] = useState(false);

  useEffect(() => {
    const role = authenticationService.currentSessionValue?.role?.name;
    const aiCookies = authenticationService.currentSessionValue?.ai_cookies;

    const latestPrompt = aiCookies?.tj_ai_prompt;
    const templateId = aiCookies?.tj_template_id;

    const hadBuilderAccess = role === 'admin' || role === 'builder';

    // Guard: end-users cannot create apps; show a permission modal instead.
    if (latestPrompt || templateId) {
      if (!hadBuilderAccess) {
        setShowInsufficentPermissionModal(true);
        return;
      }
    }

    switch (true) {
      case !!latestPrompt:
        setShowAIOnboardingLoadingScreen(true);

        createApp(
          {
            body: {
              icon: 'share', // TODO: Add a random icon for the app
              name: `Untitled App: ${uuidv4()}`,
              type: 'front-end',
              prompt: decodeURIComponent(latestPrompt),
            },
            isCommitEnabled: false,
          },
          {
            onSettled: () => {
              // As statement for onError and onSuccess were same, so have written them in onSettled
              setShowAIOnboardingLoadingScreen(false);

              deleteAiCookies();
            },
          }
        );
        break;
      case !!templateId: {
        setShowAIOnboardingLoadingScreen(true);

        if (templateId) {
          /*TODO: I Believe the people who will try the templates from site should be new to tooljet. so making name unique for existed user can be do it in sometime */
          deployTemplateApp(
            {
              identifier: templateId,
              appName: `${templateId.replace(/-/g, ' ')}`,
              dependentPlugins: [],
              shouldAutoImportPlugin: false,
              appTypeDisplayName: 'App',
              isCommitEnabled: false,
            },
            {
              onSettled: () => {
                // As statement for onError and onSuccess were same, so have written them in onSettled
                setShowAIOnboardingLoadingScreen(false);

                deleteAiCookies();
              },
            }
          );
        }
        break;
      }
      default:
        break;
    }
  }, []);

  const handleClosePermissionDeniedModal = useCallback(() => {
    setShowInsufficentPermissionModal(false);
    deleteAiCookies();
  }, [deleteAiCookies]);

  return { showAIOnboardingLoadingScreen, showInsufficentPermissionModalstate, handleClosePermissionDeniedModal };
}
