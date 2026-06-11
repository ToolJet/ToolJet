//this slice is only for the app builder
const initialState = {
  activeOrganizationId: null,
  whiteLabelText: 'ToolJet',
  whiteLabelLogo: 'assets/images/tj-logo.svg', //Default whitelbeling logo
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
