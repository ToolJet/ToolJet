import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import { setupFirstUser } from '@/modules/onboarding/services/onboarding.service';
import { appsService } from '@/_services/apps.service';
import { getSubpath } from '@/_helpers/routes';
import { authenticationService } from '@/_services';
import { utils } from '@/modules/common/helpers';

const useCEOnboardingStore = create(
  zustandDevTools((set, get) => ({
    // Admin details
    adminDetails: {
      name: '',
      email: '',
      password: '',
    },

    // Workspace name
    workspaceName: '',

    currentStep: 0,
    totalSteps: 1,
    accountCreated: false,

    // Action to update admin details
    setAdminDetails: (details) =>
      set((state) => ({
        adminDetails: { ...state.adminDetails, ...details },
      })),

    // Action to set workspace name
    setWorkspaceName: (name) => set({ workspaceName: name }),

    // Action to move to next step
    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

    // Action to move to previous step
    prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

    // action to set current step
    setCurrentStep: (step) => set({ currentStep: step }),

    // Action to reset the store
    resetStore: () =>
      set({
        adminDetails: { name: '', email: '', password: '' },
        workspaceName: '',
        currentStep: 0,
        accountCreated: false,
      }),

    // Action to prepare data for API call
    prepareSetupAdminData: () => {
      const state = get();
      return {
        ...state.adminDetails,
        workspaceName: state.workspaceName,
      };
    },

    createSuperAdminAccount: async () => {
      if (!get().accountCreated) {
        const data = get().prepareSetupAdminData();
        await setupFirstUser(data);
        set({ accountCreated: true });
      }
      get().createNewOnboardingApp();
    },

    createNewOnboardingApp: async () => {
      const session = authenticationService.currentSessionValue;
      const app = await appsService.createApp({ name: 'My App', type: 'front-end' });
      const appId = app?.id;
      utils.clearPageHistory();
      const path = getSubpath()
        ? `${getSubpath()}/${session?.current_organization_slug}/apps/${appId}`
        : `/${session?.current_organization_slug}/apps/${appId}`;
      window.location.href = path;
    },

    setAccountCreated: (value) => set({ accountCreated: value }),

    resumeSignupOnboarding: async (callBack = (resumeOnboardingSession = false) => {}) => {
      return callBack(false);
    },
  }))
);

export default useCEOnboardingStore;
