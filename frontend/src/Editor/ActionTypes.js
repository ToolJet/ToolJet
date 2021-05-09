export const ActionTypes = [
  {
    name: 'Show Alert',
    id: 'show-alert',
    options: [
      { name: 'message', type: 'text', default: 'Message !' }
    ]
  },
  {
    name: 'Run Query',
    id: 'run-query',
    options: [
      { queryId: '' }
    ]
  },
  {
    name: 'Open Webpage',
    id: 'open-webpage',
    options: [
      { name: 'url', type: 'text', default: 'https://example.com' }
    ]
  },
  {
    name: 'Show Modal',
    id: 'show-modal',
    options: [
      { name: 'modal', type: 'text', default: '' }
    ]
  }
];
