const actionDefinitions = [
  {
    name: 'runQuery',
    params: ['queryName', 'options?'],
    returns: 'Promise<any>',
    description: 'Execute a query by name with optional runtime options (like parameters or refresh).',
    examples: ['actions.runQuery("usersQuery")', 'actions.runQuery("orders", { refreshCache: true })'],
  },
  {
    name: 'setVariable',
    params: ['key', 'value'],
    returns: 'void',
    description: 'Set a global variable accessible throughout the app session.',
    examples: ['actions.setVariable("theme", "dark")'],
  },
  {
    name: 'unSetVariable',
    params: ['key'],
    returns: 'void',
    description: 'Remove a previously set global variable.',
    examples: ['actions.unSetVariable("theme")'],
  },
  {
    name: 'showAlert',
    params: ['message', 'type?'],
    returns: 'void',
    description: 'Show a transient alert. Type can be success | info | warning | danger.',
    examples: ['actions.showAlert("Saved", "success")'],
  },
  {
    name: 'logout',
    params: [],
    returns: 'void',
    description: 'Log the current user out and redirect to auth screen.',
    examples: ['actions.logout()'],
  },
  {
    name: 'showModal',
    params: ['modalIdOrName'],
    returns: 'void',
    description: 'Open a modal component by id or name.',
    examples: ['actions.showModal("userDetailsModal")'],
  },
  {
    name: 'closeModal',
    params: ['modalIdOrName'],
    returns: 'void',
    description: 'Close an open modal.',
    examples: ['actions.closeModal("userDetailsModal")'],
  },
  {
    name: 'setLocalStorage',
    params: ['key', 'value'],
    returns: 'void',
    description: 'Persist a value to localStorage (scoped to app domain).',
    examples: ['actions.setLocalStorage("token", token)'],
  },
  {
    name: 'copyToClipboard',
    params: ['text'],
    returns: 'Promise<void>',
    description: 'Copy provided text to clipboard.',
    examples: ['actions.copyToClipboard(user.email)'],
  },
  {
    name: 'goToApp',
    params: ['appIdOrSlug', 'pageIdOrName?', 'options?'],
    returns: 'void',
    description: 'Navigate to another app (and optional page).',
    examples: ['actions.goToApp("admin-panel", "users")'],
  },
  {
    name: 'generateFile',
    params: ['data', 'filename', 'mimeType?'],
    returns: 'void',
    description: 'Trigger a file download with provided data as a blob/string.',
    examples: ['actions.generateFile(csvString, "report.csv", "text/csv")'],
  },
  {
    name: 'setPageVariable',
    params: ['key', 'value'],
    returns: 'void',
    description: 'Set a page-scoped variable.',
    examples: ['actions.setPageVariable("filter", "active")'],
  },
  {
    name: 'unsetPageVariable',
    params: ['key'],
    returns: 'void',
    description: 'Remove a page-scoped variable.',
    examples: ['actions.unsetPageVariable("filter")'],
  },
  {
    name: 'switchPage',
    params: ['pageIdOrName'],
    returns: 'void',
    description: 'Switch to another page within the same app.',
    examples: ['actions.switchPage("Dashboard")'],
  },
];

const actionMap = new Map();
actionDefinitions.forEach((def) => {
  const fullName = `actions.${def.name}`;
  actionMap.set(fullName, { ...def, fullName });
});

export function getActionFunctionsMap() {
  return actionMap;
}

export function getActionFunction(fullName) {
  return actionMap.get(fullName);
}

export function formatSignature(def) {
  if (!def) return '';
  return `${def.fullName}(${def.params.join(', ')}) => ${def.returns}`;
}
