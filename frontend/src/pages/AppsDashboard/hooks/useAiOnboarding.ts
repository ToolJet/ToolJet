import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { authenticationService } from '@/_services/authentication.service';
import { useCreateApp } from '@/_services/hooks/appsServiceHooks';
import { useDeleteAiCookies } from '@/_services/hooks/aiOnboardingServiceHooks';
import { useDeployTemplateApp } from '@/_services/hooks/libraryAppServiceHooks';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import appIconConfig from '@/HomePage/Configs/AppIcon.json';

import { appTypeToDisplayNameMapping, type TAppType } from '../helper';

interface IUseAiOnboardingResult {
  isOnboarding: boolean;
  showPermissionDenied: boolean;
  closePermissionDenied: () => void;
}

// The JS mutation hooks infer `void` variables; cast once here.
type TMutateAsync = (variables: Record<string, unknown>) => Promise<unknown>;

const hasBuilderAccess = () => {
  const roleName = authenticationService.currentSessionValue?.role?.name;
  return roleName === 'admin' || roleName === 'builder';
};

// Cloud onboarding: a prompt or template chosen on the website arrives as session cookies; create that app once on first load.
export function useAiOnboarding(appType: TAppType): IUseAiOnboardingResult {
  const hasRunRef = useRef(false);

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);

  const { mutateAsync: createApp } = useCreateApp() as unknown as { mutateAsync: TMutateAsync };
  const { mutateAsync: deployTemplateApp } = useDeployTemplateApp() as unknown as { mutateAsync: TMutateAsync };
  const { mutate: deleteAiCookies } = useDeleteAiCookies();

  useEffect(() => {
    // Guards StrictMode's double effect: a second run would create a second app.
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const aiCookies = authenticationService.currentSessionValue?.ai_cookies;
    const latestPrompt: string | undefined = aiCookies?.tj_ai_prompt;
    const templateId: string | undefined = aiCookies?.tj_template_id;

    if (!latestPrompt && !templateId) return;

    if (!hasBuilderAccess()) {
      setShowPermissionDenied(true);
      return;
    }

    const run = async () => {
      setIsOnboarding(true);

      try {
        const { currentBranch, actions } = useWorkspaceBranchesStore.getState();

        if (currentBranch && appType !== 'workflow' && !actions.checkBranchExistsOnRemote(currentBranch.name)) {
          toast.error(
            'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
          );
          return;
        }

        // Errors are toasted by the mutation hooks; this only has to clean up.
        if (latestPrompt) {
          await createApp({
            body: {
              name: `Untitled App: ${uuidv4()}`,
              type: appType,
              icon: sample(appIconConfig.iconList),
              prompt: decodeURIComponent(latestPrompt),
            },
            isCommitEnabled: false,
          });
        } else if (templateId) {
          await deployTemplateApp({
            identifier: templateId,
            appName: templateId.replace(/-/g, ' '),
            appTypeDisplayName: appTypeToDisplayNameMapping[appType],
            isCommitEnabled: false,
          });
        }
      } catch {
        // Already surfaced by the mutation's onError.
      } finally {
        deleteAiCookies();
        setIsOnboarding(false);
      }
    };

    run();
  }, []);

  const closePermissionDenied = () => {
    setShowPermissionDenied(false);
    deleteAiCookies();
  };

  return { isOnboarding, showPermissionDenied, closePermissionDenied };
}
