import { create, zustandDevTools } from '../utils';
import { whiteLabellingService } from '@/_services';
import { authHeader } from '@/_helpers';

const defaultWhiteLabellingSettings = {
  WHITE_LABEL_LOGO: 'assets/images/rocket.svg',
  WHITE_LABEL_TEXT: 'ToolJet',
  WHITE_LABEL_FAVICON: 'assets/images/logo.svg',
};

const whiteLabellingOptions = {
  WHITE_LABEL_LOGO: 'App Logo',
  WHITE_LABEL_TEXT: 'Page Title',
  WHITE_LABEL_FAVICON: 'Favicon',
};

const initialState = {
  activeOrganizationId: null,
  whiteLabelText: defaultWhiteLabellingSettings.WHITE_LABEL_TEXT,
  whiteLabelLogo: defaultWhiteLabellingSettings.WHITE_LABEL_LOGO,
  whiteLabelFavicon: defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON,
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
              .get(null, organizationId)
              .then((settings) => {
                set({
                  whiteLabelText:
                    settings[whiteLabellingOptions.WHITE_LABEL_TEXT] || defaultWhiteLabellingSettings.WHITE_LABEL_TEXT,
                  whiteLabelLogo:
                    settings[whiteLabellingOptions.WHITE_LABEL_LOGO] || defaultWhiteLabellingSettings.WHITE_LABEL_LOGO,
                  whiteLabelFavicon:
                    settings[whiteLabellingOptions.WHITE_LABEL_FAVICON] ||
                    defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON,
                  loadingWhiteLabelDetails: false,
                  isWhiteLabelDetailsFetched: true,
                });
                resolve();
              })
              .catch((error) => {
                console.error('Error in fetchWhiteLabelDetails:', error);
                set({ loadingWhiteLabelDetails: false, activeOrganizationId: null, isWhiteLabelDetailsFetched: false });
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
