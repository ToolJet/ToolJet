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
    }
]