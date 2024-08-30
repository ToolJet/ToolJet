import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import {
  setupSuperAdmin,
  requestTrial,
  getLicensePlans,
  getOnboardingSession,
  trialDeclined,
} from '@/modules/onboarding/services/onboarding.service';

const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  ACCOUNT_CREATED: 'account_created',
  PLAN_SELECTED: 'plan_selected',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

const useOnboardingStore = create(
  zustandDevTools((set, get) => ({
    // Step 0: Admin details
    adminDetails: {
      name: '',
      email: '',
      password: '',
    },

    // Step 1: Company information
    companyInfo: {
      companyName: '',
      buildPurpose: '',
    },

    // Step 2: Workspace name
    workspaceName: '',

    currentStep: 0,
    totalSteps: 4,
    isOnboardingStepsCompleted: false,
    isSetUpToolJetCompleted: false,
    accountCreated: false,
    disabledBackButton: false,
    planSelected: false,

    // Action to update admin details
    setAdminDetails: (details) =>
      set((state) => ({
        adminDetails: { ...state.adminDetails, ...details },
      })),

    // Action to update company information
    setCompanyInfo: (info) =>
      set((state) => ({
        companyInfo: { ...state.companyInfo, ...info },
      })),

    // Action to set workspace name
    setWorkspaceName: (name) => set({ workspaceName: name }),

    // Action to move to next step
    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

    // Action to move to previous step
    prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

    setTotalSteps: (steps) => set({ totalSteps: steps }),

    // Action to reset the store
    resetStore: () =>
      set({
        adminDetails: { name: '', email: '', password: '' },
        companyInfo: {
          companyName: '',
          buildPurpose: '',
        },
        workspaceName: '',
        currentStep: 0,
        accountCreated: false,
      }),

    // Action to prepare data for API call
    prepareSetupAdminData: () => {
      const state = get();
      return {
        ...state.adminDetails,
        ...state.companyInfo,
        workspaceName: state.workspaceName,
      };
    },

    createSuperAdminAccount: async () => {
      if (!get().accountCreated) {
        const data = get().prepareSetupAdminData();
        await setupSuperAdmin(data);
        set({ accountCreated: true });
      }
      get().nextStep();
    },

    startTrial: async () => {
      if (!get().planSelected) {
        await requestTrial();
        set({ planSelected: true });
      }
      get().nextStep();
    },

    fetchLicensePlans: async () => {
      return await getLicensePlans();
    },

    completeToolJetSetup: () => set({ isSetUpToolJetCompleted: true }),

    setOnboardingStepsCompleted: () => set({ isOnboardingStepsCompleted: true }),

    setAccountCreated: (value) => set({ accountCreated: value }),

    resumeOnboarding: async (status) => {
      const onboardingDetails = await getOnboardingSession();
      const commonState = {
        isSetUpToolJetCompleted: true,
        accountCreated: true,
        disabledBackButton: true,
        adminDetails: onboardingDetails.adminDetails,
        companyInfo: onboardingDetails.companyInfo,
        workspaceName: onboardingDetails.workspaceName,
      };
      if (onboardingDetails.onboardingStatus === ONBOARDING_STATUS.ACCOUNT_CREATED) {
        set({
          ...commonState,
          currentStep: 3,
        });
      } else if (onboardingDetails.onboardingStatus === ONBOARDING_STATUS.PLAN_SELECTED) {
        set({
          ...commonState,
          planSelected: true,
          currentStep: 4,
        });
      }
    },

    trialDeclined: async () => {
      if (!get().planSelected) {
        await trialDeclined();
        set({ planSelected: true });
      }
      get().nextStep();
    },
  }))
);

export default useOnboardingStore;
