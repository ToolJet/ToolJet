export const ActionTypes = [
  {
    name: 'Run query',
    id: 'run-query',
    options: [{ queryId: '' }],
    group: 'run-action',
  },
  {
    name: 'Show Alert',
    id: 'show-alert',
    options: [{ name: 'message', type: 'text', default: 'Message !' }],
    group: 'run-action',
  },
  {
    name: 'Control component',
    id: 'control-component',
    options: [
      { name: 'component', type: 'text', default: '' },
      { name: 'action', type: 'text', default: '' },
    ],
    group: 'control-component',
  },
  {
    name: 'Show modal',
    id: 'show-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
    group: 'control-component',
  },
  {
    name: 'Close modal',
    id: 'close-modal',
    options: [{ name: 'modal', type: 'text', default: '' }],
    group: 'control-component',
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
    group: 'control-component',
  },
  {
    name: 'Switch page',
    id: 'switch-page',
    options: [{ name: 'page', type: 'text', default: '' }],
    group: 'navigation',
  },
  {
    name: 'Go to app',
    id: 'go-to-app',
    options: [
      { name: 'app', type: 'text', default: '' },
      { name: 'queryParams', type: 'code', default: '[]' },
    ],
    group: 'navigation',
  },
  {
    name: 'Open webpage',
    id: 'open-webpage',
    options: [{ name: 'url', type: 'text', default: 'https://example.com' }],
    group: 'navigation',
  },
  {
    name: 'Set page variable',
    id: 'set-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    group: 'variable',
  },
  {
    name: 'Unset page variable',
    id: 'unset-page-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    group: 'variable',
  },
  {
    name: 'Unset all page variables',
    id: 'unset-all-page-variables',
    group: 'variable',
  },
  {
    name: 'Set variable',
    id: 'set-custom-variable',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    group: 'variable',
  },
  {
    name: 'Unset variable',
    id: 'unset-custom-variable',
    options: [{ name: 'key', type: 'code', default: '' }],
    group: 'variable',
  },
  {
    name: 'Unset all variables',
    id: 'unset-all-custom-variables',
    group: 'variable',
  },
  {
    name: 'Logout',
    id: 'logout',
    group: 'other',
  },
  {
    name: 'Generate file',
    id: 'generate-file',
    options: [
      { name: 'fileType', type: 'text', default: '' },
      { name: 'fileName', type: 'text', default: '' },
      { name: 'data', type: 'code', default: '{{[]}}' },
    ],
    group: 'other',
  },
  {
    name: 'Set local storage',
    id: 'set-localstorage-value',
    options: [
      { name: 'key', type: 'code', default: '' },
      { name: 'value', type: 'code', default: '' },
    ],
    group: 'other',
  },
  {
    name: 'Copy to clipboard',
    id: 'copy-to-clipboard',
    options: [{ name: 'copy-to-clipboard', type: 'text', default: '' }],
    group: 'other',
  },
];
