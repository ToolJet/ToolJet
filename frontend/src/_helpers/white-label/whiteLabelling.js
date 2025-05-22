import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { decodeEntities } from '@/_helpers/utils';

// White-label options mapping
export const whiteLabellingOptions = {
  WHITE_LABEL_TEXT: 'white_label_text',
  WHITE_LABEL_LOGO: 'white_label_logo',
  WHITE_LABEL_FAVICON: 'white_label_favicon',
};

export function retrieveWhiteLabelFavicon() {
  const { whiteLabelFavicon } = useWhiteLabellingStore.getState();
  return whiteLabelFavicon;
}

export function retrieveWhiteLabelText() {
  const { whiteLabelText } = useWhiteLabellingStore.getState();
  return whiteLabelText;
}

export function retrieveWhiteLabelLogo() {
  const { whiteLabelLogo } = useWhiteLabellingStore.getState();
  return whiteLabelLogo;
}

// Set favicon and title dynamically
export async function setFaviconAndTitle(location) {
  // TODO:Uncomment-if-needed
  // await fetchWhiteLabelDetails(organizationId);
  const { whiteLabelFavicon, whiteLabelText } = useWhiteLabellingStore.getState();

  // Set favicon
  let links = document.querySelectorAll("link[rel='icon']");
  if (links.length === 0) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.getElementsByTagName('head')[0].appendChild(link);
    links = [link];
  }
  links.forEach((link) => {
    link.href = whiteLabelFavicon;
  });

  // Set page title based on route
  const isEditorOrViewer = ['/apps/', '/applications/'].some((path) => location?.pathname.includes(path));
  if (isEditorOrViewer) return;

  const pageTitles = {
    'instance-settings': 'Settings',
    'workspace-settings': 'Workspace settings',
    integrations: 'Marketplace',
    workflows: 'Workflows',
    'data-sources': 'Data sources',
    'audit-logs': 'Audit logs',
    'account-settings': 'Profile settings',
    settings: 'Profile settings',
    login: '',
    signUp: '',
    error: '',
    signup: '',
    'organization-invitations': '',
    invitation: '',
    'forgot-password': '',
    'reset-password': '',
    'workspace-constants': 'Workspace constants',
    setup: '',
    '/': 'Dashboard',
  };

  const pageTitleKey = Object.keys(pageTitles).find((path) => location?.pathname.includes(path));
  const pageTitle = pageTitles[pageTitleKey] || '';

  document.title = pageTitle ? `${decodeEntities(pageTitle)} | ${whiteLabelText}` : `${decodeEntities(whiteLabelText)}`;
}

export async function fetchAndSetWindowTitle(pageDetails) {
  const whiteLabelText = retrieveWhiteLabelText();
  let pageTitleKey = pageDetails?.page || '';
  let pageTitle = '';
  let mode = pageDetails?.mode || '';
  let isPreview = !pageDetails?.isReleased || false;
  switch (pageTitleKey) {
    case pageTitles.VIEWER: {
      const titlePrefix = pageDetails?.preview ? 'Preview - ' : '';
      pageTitle = `${titlePrefix}${pageDetails?.appName || 'My App'}`;
      break;
    }
    case pageTitles.EDITOR:
    case pageTitles.WORKFLOW_EDITOR: {
      if (mode == 'edit') {
        pageTitle = `${pageDetails?.appName}`;
      } else {
        pageTitle = `Preview - ${pageDetails?.appName}` || 'My App';
      }
      break;
    }
    default: {
      pageTitle = pageTitleKey;
      break;
    }
  }
  if (!isPreview && mode === 'view') {
    document.title = `${pageDetails?.appName}`;
    return;
  }
  document.title = !(pageDetails?.preview === false) ? `${pageTitle} | ${whiteLabelText}` : `${pageTitle}`;
}

// Fetch and update white label settings
export async function fetchWhiteLabelDetails(organizationId = null) {
  const { isWhiteLabelDetailsFetched, actions, activeOrganizationId } = useWhiteLabellingStore.getState();
  // Check if data should be fetched
  const shouldFetch =
    !isWhiteLabelDetailsFetched || !activeOrganizationId || (organizationId && activeOrganizationId !== organizationId);

  if (shouldFetch) {
    try {
      await actions.fetchWhiteLabelDetails(organizationId);
      applyWhiteLabelling();
    } catch (error) {
      console.error('Error fetching white label settings:', error);
    }
  }
}

// Reset white label settings to default
export async function resetToDefaultWhiteLabels() {
  const { actions } = useWhiteLabellingStore.getState();
  actions.resetWhiteLabellingStoreBackToInitialState();
  applyWhiteLabelling();
}

// Check if current settings match the default values
export function checkWhiteLabelsDefaultState() {
  const { isDefaultWhiteLabel } = useWhiteLabellingStore.getState();
  return isDefaultWhiteLabel;
}

export const pageTitles = {
  INSTANCE_SETTINGS: 'Settings',
  WORKSPACE_SETTINGS: 'Workspace settings',
  INTEGRATIONS: 'Marketplace',
  WORKFLOWS: 'Workflows',
  DATABASE: 'Database',
  DATA_SOURCES: 'Data sources',
  AUDIT_LOGS: 'Audit logs',
  ACCOUNT_SETTINGS: 'Profile settings',
  SETTINGS: 'Profile settings',
  EDITOR: 'Editor',
  WORKFLOW_EDITOR: 'workflowEditor',
  VIEWER: 'Viewer',
  DASHBOARD: 'Dashboard',
  WORKSPACE_CONSTANTS: 'Workspace constants',
};

// Apply the white label settings from the store
function applyWhiteLabelling() {
  const { whiteLabelText, whiteLabelFavicon } = useWhiteLabellingStore.getState();

  document.title = whiteLabelText;

  let links = document.querySelectorAll("link[rel='icon']");
  if (links.length === 0) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.getElementsByTagName('head')[0].appendChild(link);
    links = [link];
  }
  links.forEach((link) => {
    link.href = whiteLabelFavicon;
  });
}
