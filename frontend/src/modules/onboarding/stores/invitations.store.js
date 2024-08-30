import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import useOnboardingStore from './onboarding.store';
import { onboarding, finishOnboarding, createOnboardSampleApp } from '@/modules/onboarding/services/onboarding.service';
import { authenticationService } from '@/_services';

const initialState = {
  token: null,
  organizationToken: null,
  source: null,
  organizationId: null,
  redirectTo: '/',
};

const useInvitationsStore = create(
  zustandDevTools((set, get) => ({
    ...useOnboardingStore.getState(),

    initialState,

    initiatedInvitedUserOnboarding: false,

    inviteeEmail: null,

    initiateInvitedUserOnboarding: (states) => {
      get().setTotalSteps(3);
      get().nextStep();
      set((state) => ({ ...states, initiatedInvitedUserOnboarding: true }));
    },

    onboardUser: async () => {
      if (!useOnboardingStore.getState().accountCreated) {
        const { token, source, organizationToken } = get();
        const { companyInfo, workspaceName, setAccountCreated } = useOnboardingStore.getState();
        const { companyName, buildPurpose } = companyInfo;
        const data = await onboarding({
          companyName,
          buildPurpose,
          token,
          source,
          organizationToken,
          workspaceName,
        });
        setAccountCreated(true);
      }
      get().nextStep();
    },

    onboardUserOrCreateAdmin: async () => {
      if (get().initiatedInvitedUserOnboarding) {
        await get().onboardUser();
        return;
      }
      await get().createSuperAdminAccount();
    },

    createOnboardSampleApp: async () => {
      const session = authenticationService.currentSessionValue;
      const { app } = await createOnboardSampleApp();
      const appId = app[0]?.id;
      window.location.href = `/${session?.current_organization_slug}/apps/${appId}`;
    },

    completeOnboarding: async () => {
      await finishOnboarding();
      await get().createOnboardSampleApp();
    },
  }))
);

export default useInvitationsStore;
