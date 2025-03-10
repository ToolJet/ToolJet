import { decodeEntities } from '@/_helpers/utils';

export const defaultWhiteLabellingSettings = {
  WHITE_LABEL_LOGO: 'assets/images/rocket.svg',
  WHITE_LABEL_TEXT: 'ToolJet',
  WHITE_LABEL_FAVICON: 'assets/images/logo.svg',
};

export const whiteLabellingOptions = {
  WHITE_LABEL_LOGO: 'App Logo',
  WHITE_LABEL_TEXT: 'Page Title',
  WHITE_LABEL_FAVICON: 'Favicon',
};

export async function fetchWhiteLabelDetails() {}

export async function checkWhiteLabelsDefaultState() {
  return true;
}

export async function resetToDefaultWhiteLabels() {}

export function retrieveWhiteLabelText() {
  return window.public_config?.WHITE_LABEL_TEXT || defaultWhiteLabellingSettings.WHITE_LABEL_TEXT;
}

export function retrieveWhiteLabelLogo() {
  return window.public_config?.WHITE_LABEL_LOGO || defaultWhiteLabellingSettings.WHITE_LABEL_LOGO;
}

export function retrieveWhiteLabelFavicon() {
  return window.public_config?.WHITE_LABEL_FAVICON || defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
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

// to set favicon and title from router for individual pages
export async function setFaviconAndTitle(whiteLabelFavicon, whiteLabelText, location) {
  if (!whiteLabelFavicon || !whiteLabelText) {
    whiteLabelFavicon = await retrieveWhiteLabelFavicon();
    whiteLabelText = await retrieveWhiteLabelText();
  }
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
    link.href = `${whiteLabelFavicon || defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON}`;
  });
  // Set title
  const isEditorOrViewerGoingToRender = ['/apps/', '/applications/'].some((path) => location?.pathname.includes(path));
  if (isEditorOrViewerGoingToRender) {
    return;
  }
  const pathToTitle = {
    'instance-settings': pageTitles.INSTANCE_SETTINGS,
    'workspace-settings': pageTitles.WORKSPACE_SETTINGS,
    integrations: pageTitles.INTEGRATIONS,
    workflows: pageTitles.WORKFLOWS,
    'data-sources': pageTitles.DATA_SOURCES,
    'audit-logs': pageTitles.AUDIT_LOGS,
    'account-settings': pageTitles.ACCOUNT_SETTINGS,
    settings: pageTitles.INSTANCE_SETTINGS,
    login: '',
    signUp: '',
    error: '',
    signup: '',
    'organization-invitations': '',
    invitation: '',
    'forgot-password': '',
    'reset-password': '',
    'workspace-constants': pageTitles.WORKSPACE_CONSTANTS,
    setup: '',
  };
  const pageTitleKey = Object.keys(pathToTitle).find((path) => location?.pathname.includes(path));
  const pageTitle = pathToTitle[pageTitleKey];

  //For undefined routes
  if (pageTitle === undefined) {
    return;
  }

  if (pageTitleKey && !isEditorOrViewerGoingToRender) {
    document.title = pageTitle
      ? `${decodeEntities(pageTitle)} | ${whiteLabelText || defaultWhiteLabellingSettings.WHITE_LABEL_TEXT}`
      : `${decodeEntities(whiteLabelText) || defaultWhiteLabellingSettings.WHITE_LABEL_TEXT}`;
  }
}

export async function fetchAndSetWindowTitle(pageDetails) {
  const whiteLabelText = await retrieveWhiteLabelText();
  let pageTitleKey = pageDetails?.page || '';
  let pageTitle = '';
  switch (pageTitleKey) {
    case pageTitles.VIEWER: {
      const titlePrefix = pageDetails?.preview ? 'Preview - ' : '';
      pageTitle = `${titlePrefix}${pageDetails?.appName || 'My App'}`;
      break;
    }
    case pageTitles.EDITOR:
    case pageTitles.WORKFLOW_EDITOR: {
      pageTitle = pageDetails?.appName || 'My App';
      break;
    }
    default: {
      pageTitle = pageTitleKey;
      break;
    }
  }
  document.title = !(pageDetails?.preview === false) ? `${pageTitle} | ${whiteLabelText}` : `${pageTitle}`;
}
