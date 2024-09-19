import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import { setupFirstUser } from '@/modules/onboarding/services/onboarding.service';

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
      window.location.href = '/';
    },

    setAccountCreated: (value) => set({ accountCreated: value }),
  }))
);

export default useCEOnboardingStore;
