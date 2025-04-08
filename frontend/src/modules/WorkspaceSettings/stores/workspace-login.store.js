import create from 'zustand';

const useAutoSSOLoginStore = create((set, get) => ({
  isLoading: true,
  isSaving: false,
  showDisablingPasswordConfirmation: false,
  options: {},
  initialOptions: {},
  hasChanges: false,
  isAnySSOEnabled: false,
  ssoOptions: [],
  defaultSSO: false,
  instanceSSO: [],
  isBasicPlan: false,

  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setShowDisablingPasswordConfirmation: (show) => set({ showDisablingPasswordConfirmation: show }),
  setOptions: (options) => set({ options }),
  setInitialOptions: (initialOptions) => set({ initialOptions }),
  setHasChanges: (hasChanges) => set({ hasChanges }),
  setIsAnySSOEnabled: (isAnySSOEnabled) => set({ isAnySSOEnabled }),
  setSsoOptions: (ssoOptions) => set({ ssoOptions }),
  setDefaultSSO: (defaultSSO) => set({ defaultSSO }),
  setInstanceSSO: (instanceSSO) => set({ instanceSSO }),
  setIsBasicPlan: (isBasicPlan) => set({ isBasicPlan }),

  toggleAutomaticSsoLogin: () =>
    set((state) => ({
      options: {
        ...state.options,
        automaticSsoLogin: !state.options.automaticSsoLogin,
      },
    })),

  setPasswordLoginEnabled: (enabled) =>
    set((state) => ({
      options: {
        ...state.options,
        passwordLoginEnabled: enabled,
      },
    })),

  handleCheckboxChange: (field) => {
    const state = get();
    const newValue = !state.options[field];
    set((state) => ({
      options: {
        ...state.options,
        [field]: newValue,
      },
    }));
    get().checkForChanges();

    if (field === 'passwordLoginEnabled' && !newValue) {
      get().setShowDisablingPasswordConfirmation(true);
    }
  },

  checkForChanges: () => {
    const state = get();
    const hasChanges = JSON.stringify(state.options) !== JSON.stringify(state.initialOptions);
    set({ hasChanges });
  },

  canToggleAutomaticSSOLogin: () => {
    const state = get();
    return !state.options.passwordLoginEnabled && state.ssoOptions.filter((sso) => sso.enabled).length === 1;
  },

  // Translation function (you might want to replace this with your actual translation implementation)
  t: (key, defaultValue) => defaultValue,

  // You might want to add a function to fetch initial data and set multiple states at once
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      // Simulating an API call
      const data = await fetchDataFromAPI();
      set({
        options: data.options,
        initialOptions: data.options,
        isAnySSOEnabled: data.isAnySSOEnabled,
        ssoOptions: data.ssoOptions,
        defaultSSO: data.defaultSSO,
        instanceSSO: data.instanceSSO,
        isBasicPlan: data.isBasicPlan,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ isLoading: false });
    }
  },

  // Function to save changes
  saveChanges: async () => {
    const state = get();
    set({ isSaving: true });
    try {
      // Simulating an API call to save data
      await saveDataToAPI(state.options);
      set({
        initialOptions: state.options,
        hasChanges: false,
        isSaving: false,
      });
    } catch (error) {
      console.error('Error saving data:', error);
      set({ isSaving: false });
    }
  },
}));

// These functions should be replaced with actual API calls
const fetchDataFromAPI = async () => {
  // Simulate API call
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          options: { automaticSsoLogin: false, passwordLoginEnabled: true },
          isAnySSOEnabled: false,
          ssoOptions: [],
          defaultSSO: false,
          instanceSSO: [],
          isBasicPlan: false,
        }),
      1000
    )
  );
};

const saveDataToAPI = async (data) => {
  // Simulate API call
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
};

export default useAutoSSOLoginStore;
