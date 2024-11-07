const initialState = {
  organization: {},
};

export const createOrganizationSlice = (set) => ({
  ...initialState,
  setOrganization: (organization) => set(() => ({ organization }), false, 'setOrganization'),
});
