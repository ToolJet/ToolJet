export const ActionTypes = [
  {
    name: 'Run query',
    id: 'run-query',
    options: [{ queryId: '' }],
    icon: '',
  },
  {
    name: 'Show Alert',
    id: 'show-alert',
    options: [{ name: 'message', type: 'text', default: 'Message !' }],
    icon: '',
  },
  {
    name: 'Control component',
    id: 'control-component',
    options: [
      { name: 'component', type: 'text', default: '' },
      { name: 'action', type: 'text', default: '' },
    ],
    icon: '',
  },
  {
    name: 'Show modal',
    id: 'show-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
    icon: '',
  },
  {
    name: 'Close modal',
    id: 'close-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
    icon: '',
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
    icon: '',
  },
  {
    name: 'Switch page',
    id: 'switch-page',
    options: [{ name: 'page', type: 'text', default: '' }],
    icon: '',
  },
  {
    name: 'Go to app',
    id: 'go-to-app',
    options: [
      { name: 'app', type: 'text', default: '' },
      { name: 'queryParams', type: 'code', default: '[]' },
    ],
    icon: '',
  },
  {
    name: 'Open webpage',
    id: 'open-webpage',
    options: [{ name: 'url', type: 'text', default: 'https://example.com' }],
    icon: '',
  },
  {
    name: 'Set page variable',
    id: 'set-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    icon: '',
  },
  {
    name: 'Unset page variable',
    id: 'unset-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    icon: '',
  },
  {
    name: 'Unset all page variables',
    id: 'unset-all-page-variables',
    icon: '',
  },
  {
    name: 'Set variable',
    id: 'set-custom-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    icon: '',
  },
  {
    name: 'Unset variable',
    id: 'unset-custom-variable',
    options: [{ name: 'key', type: 'code', default: '' }],
    icon: '',
  },
  {
    name: 'Unset all variables',
    id: 'unset-all-custom-variables',
    icon: '',
  },
  {
    name: 'Logout',
    id: 'logout',
    icon: '',
  },
  {
    name: 'Generate file',
    id: 'generate-file',
    options: [
      { name: 'fileType', type: 'text', default: '' },
      { name: 'fileName', type: 'text', default: '' },
      { name: 'data', type: 'code', default: '{{[]}}' },
    ],
    icon: '',
  },
  {
    name: 'Set local storage',
    id: 'set-localstorage-value',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    icon: '',
  },
  {
    name: 'Copy to clipboard',
    id: 'copy-to-clipboard',
    options: [{ name: 'copy-to-clipboard', type: 'text', default: '' }],
    icon: '',
  },
];
