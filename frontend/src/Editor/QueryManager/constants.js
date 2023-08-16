export const staticDataSources = [
  { kind: 'restapi', id: 'null', name: 'REST API', shortName: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code', shortName: 'JavaScript' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code', shortName: 'Python' },
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database', shortName: 'ToolJet DB' },
];

export const tabs = ['JSON', 'Raw'];

export const getTheme = (darkMode) => {
  return {
    scheme: 'bright',
    author: 'chris kempson (http://chriskempson.com)',
    base00: darkMode ? '#272822' : '#000000',
    base01: '#303030',
    base02: '#505050',
    base03: '#b0b0b0',
    base04: '#d0d0d0',
    base05: '#e0e0e0',
    base06: '#f5f5f5',
    base07: '#ffffff',
    base08: '#fb0120',
    base09: '#fc6d24',
    base0A: '#fda331',
    base0B: '#a1c659',
    base0C: '#76c7b7',
    base0D: '#6fb3d2',
    base0E: '#d381c3',
    base0F: '#be643c',
  };
};

export const customToggles = {
  runOnPageLoad: {
    dataCy: 'run-on-app-load',
    action: 'runOnPageLoad',
    label: 'Run this query on application load?',
    translatedLabel: 'editor.queryManager.runQueryOnApplicationLoad',
  },
  requestConfirmation: {
    dataCy: 'confirmation-before-run',
    action: 'requestConfirmation',
    label: 'Request confirmation before running query?',
    translatedLabel: 'editor.queryManager.confirmBeforeQueryRun',
  },
  showSuccessNotification: {
    dataCy: 'notification-on-success',
    action: 'showSuccessNotification',
    label: 'Show notification on success?',
    translatedLabel: 'editor.queryManager.notificationOnSuccess',
  },
};

export const mockDataQueryAsComponent = (events) => {
  return {
    component: { component: { definition: { events: events } } },
    componentMeta: {
      events: {
        onDataQuerySuccess: { displayName: 'Query Success' },
        onDataQueryFailure: { displayName: 'Query Failure' },
      },
    },
  };
};

export const schemaUnavailableOptions = {
  restapi: {
    method: 'get',
    url: '',
    url_params: [['', '']],
    headers: [['', '']],
    body: [['', '']],
    json_body: null,
    body_toggle: false,
  },
  stripe: {},
  tooljetdb: {
    operation: '',
  },
  runjs: {
    code: '',
    hasParamSupport: true,
    parameters: [],
  },
  runpy: {},
};

export const defaultSources = {
  restapi: { kind: 'restapi', id: 'null', name: 'REST API' },
  runjs: { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  tooljetdb: { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  runpy: { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
};
