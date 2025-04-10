//this slice is only for the app builder
const initialState = {
  activeOrganizationId: null,
  whiteLabelText: 'ToolJet',
  whiteLabelLogo: null,
  whiteLabelFavicon: null,
  loadingWhiteLabelDetails: true,
  isWhiteLabelDetailsFetched: false,
};

export const createWhiteLabellingSlice = (set) => ({
  ...initialState,
  resetWhiteLabellingState: () => {
    set(initialState);
  },
  updateWhiteLabelDetails: (details) => {
    set(details);
  },
});
