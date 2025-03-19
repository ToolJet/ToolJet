import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import useOnboardingStore from '../onboardingStore';
import { onboarding } from '@/modules/onboarding/services/onboarding.service';

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
      set(() => ({ ...states, initiatedInvitedUserOnboarding: true }));
    },

    onboardUser: async () => {
      if (!useOnboardingStore.getState().accountCreated) {
        const { token, source, organizationToken } = get();
        const { workspaceName, setAccountCreated } = useOnboardingStore.getState();
        await onboarding({
          token,
          source,
          organizationToken,
          workspaceName,
        });
        setAccountCreated(true);
      }
      get().createNewOnboardingApp();
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
      utils.clearPageHistory();
      const path = getSubpath()
        ? `${getSubpath()}/${session?.current_organization_slug}/apps/${appId}`
        : `/${session?.current_organization_slug}/apps/${appId}`;
      history.pushState(null, null, path);
      window.location.reload();
    },

    completeOnboarding: async () => {
      await finishOnboarding();
      window.location = '/';
      // TODO: enable sample app creation once the api is ready
      // await get().createOnboardSampleApp();
    },
  }))
);

export default useInvitationsStore;
