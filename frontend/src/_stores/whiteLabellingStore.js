import { create, zustandDevTools } from './utils';
import { whiteLabellingService } from '@/_services';
import { authHeader } from '@/_helpers';

import useStore from '@/AppBuilder/_stores/store';
// Define constants locally to avoid import issues
const DEFAULT_WHITE_LABEL_SETTINGS = {
  WHITE_LABEL_TEXT: 'ToolJet',
  WHITE_LABEL_LOGO: null,
  WHITE_LABEL_FAVICON: null,
};

const WHITE_LABEL_OPTIONS = {
  WHITE_LABEL_TEXT: 'white_label_text',
  WHITE_LABEL_LOGO: 'white_label_logo',
  WHITE_LABEL_FAVICON: 'white_label_favicon',
};

const initialState = {
  activeOrganizationId: null,
  whiteLabelText: DEFAULT_WHITE_LABEL_SETTINGS.WHITE_LABEL_TEXT,
  whiteLabelLogo: DEFAULT_WHITE_LABEL_SETTINGS.WHITE_LABEL_LOGO,
  whiteLabelFavicon: DEFAULT_WHITE_LABEL_SETTINGS.WHITE_LABEL_FAVICON,
  loadingWhiteLabelDetails: true,
  isWhiteLabelDetailsFetched: false,
};

export const useWhiteLabellingStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        fetchWhiteLabelDetails: (organizationId) => {
          return new Promise((resolve, reject) => {
            const headers = authHeader();
            const workspaceId = headers['tj-workspace-id'];
            set({
              loadingWhiteLabelDetails: true,
              activeOrganizationId: organizationId || workspaceId,
              isWhiteLabelDetailsFetched: false,
            });
            whiteLabellingService
              .get(organizationId)
              .then((settings) => {
                const updatedSettings = {
                  whiteLabelText: settings[WHITE_LABEL_OPTIONS.WHITE_LABEL_TEXT],
                  whiteLabelLogo: settings[WHITE_LABEL_OPTIONS.WHITE_LABEL_LOGO],
                  whiteLabelFavicon: settings[WHITE_LABEL_OPTIONS.WHITE_LABEL_FAVICON],
                  loadingWhiteLabelDetails: false,
                  isWhiteLabelDetailsFetched: true,
                  isDefaultWhiteLabel: settings.is_default,
                };
                set(updatedSettings);
                //update the white-label slice from here. somehow when we open the builder the actual store values goes back to default state. need to investigte more
                useStore.getState().updateWhiteLabelDetails(updatedSettings);
                resolve();
              })
              .catch((error) => {
                console.error('Error in fetchWhiteLabelDetails:', error);
                set({
                  loadingWhiteLabelDetails: false,
                  activeOrganizationId: null,
                  isWhiteLabelDetailsFetched: false,
                });
                reject(error);
              });
          });
        },
        resetWhiteLabellingStoreBackToInitialState: () => {
          set({ ...initialState });
        },
      },
    }),
    { name: 'White Labeling Store' }
  )
);

// Selectors
export const useWhiteLabelText = () => useWhiteLabellingStore((state) => state.whiteLabelText);
export const useWhiteLabelLogo = () => useWhiteLabellingStore((state) => state.whiteLabelLogo);
export const useWhiteLabelFavicon = () => useWhiteLabellingStore((state) => state.whiteLabelFavicon);
export const useWhiteLabellingActions = () => useWhiteLabellingStore((state) => state.actions);
