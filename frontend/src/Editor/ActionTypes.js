export const ActionTypes = [
  {
    name: 'Show Alert',
    id: 'show-alert',
    options: [{ name: 'message', type: 'text', default: 'Message !' }],
  },
  {
    name: 'Logout',
    id: 'logout',
  },
  {
    name: 'Run Query',
    id: 'run-query',
    options: [{ queryId: '' }],
  },
  {
    name: 'Open Webpage',
    id: 'open-webpage',
    options: [{ name: 'url', type: 'text', default: 'https://example.com' }],
  },
  {
    name: 'Go to app',
    id: 'go-to-app',
    options: [
      { name: 'app', type: 'text', default: '' },
      { name: 'queryParams', type: 'code', default: '[]' },
    ],
  },
  {
    name: 'Show Modal',
    id: 'show-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
  },
  {
    name: 'Close Modal',
    id: 'close-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
  },
  {
    name: 'Copy to clipboard',
    id: 'copy-to-clipboard',
    options: [{ name: 'copy-to-clipboard', type: 'text', default: '' }],
  },
  {
    name: 'Set local storage',
    id: 'set-localstorage-value',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
  },
  {
    name: 'Generate file',
    id: 'generate-file',
    options: [
      { name: 'fileType', type: 'text', default: '' },
      { name: 'fileName', type: 'text', default: '' },
      { name: 'data', type: 'code', default: '{{[]}}' },
    ],
  },
  {
    name: 'Set table page',
    id: 'set-table-page',
    options: [
      {
        name: 'table',
        type: 'text',
        default: '',
      },
      { name: 'pageIndex', type: 'text', default: '{{1}}' },
    ],
  },
  {
    name: 'Set variable',
    id: 'set-custom-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
  },
  {
    name: 'Unset variable',
    id: 'unset-custom-variable',
    options: [{ name: 'key', type: 'code', default: '' }],
  },
  {
    name: 'Switch page',
    id: 'switch-page',
    options: [{ name: 'page', type: 'text', default: '' }],
  },
  {
    name: 'Set page variable',
    id: 'set-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
  },
  {
    name: 'Unset page variable',
    id: 'unset-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
  },
  {
    name: 'Control component',
    id: 'control-component',
    options: [
      { name: 'component', type: 'text', default: '' },
      { name: 'action', type: 'text', default: '' },
    ],
  },
];
